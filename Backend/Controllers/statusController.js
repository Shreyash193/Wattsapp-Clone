const Status = require("../Models/status");
const response = require("../Utils/responseHandler");
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");

exports.createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.userId;
        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || "text";



        //if file exists upload to cloudinary
        if (file) {
            const upload = await uploadFileToCloudinary(file);
            if (!upload?.secure_url) {
                return res.status(500).json({ message: "File upload failed" });
            };
            mediaUrl = upload.secure_url;

            if (file.mimetype.startsWith("image/")) {
                finalContentType = "image";
            }
            else if (file.mimetype.startsWith("video/")) {
                finalContentType = "video";
            }
            else {
                return res.status(400).json({ message: "Invalid file type" });
            }
        }
        else if (content?.trim()) {
            finalContentType = "text";
        }
        else {
            return res.status(400).json({ message: "Message content is required" });
        }

        const expiresAt = new Date();

        expiresAt.setHours(expiresAt.getHours() + 24);


        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            expiresAt,
        })
        await status.save();


        const populatedStatus = await Status.findById(status?._id).populate("user", "userName profilePicture")
            .populate("viewers", "userName profilePicture");

        //Emit socket event 

        if (req.io && req.socketUserMap) {
            //Brodcast to all connecting users except creator
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId != userId) {
                    req.io.to(socketId).emit("new status", populatedStatus);
                }

            }
        }

        return res.status(200).json({ message: "status created successfully", populatedStatus });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }

}

exports.getstatus = async (req, res) => {
    try {
        const status = await Status.find({
            expiresAt: { $gt: new Date() },
        })
            .populate("user", "userName profilePicture")
            .populate("viewers", "userName profilePicture")
            .sort({ createdAt: -1 });

        return res.status(200).json({ message: "status retrived successfully", status });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

exports.viewStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.userId;

    try {
        const status = await Status.findById(statusId);
        if (!status) {
            return res.status(404).json("status  not found");
        }
        const viewers = status.viewers || [];
        const alreadyViewed = viewers.some((viewerId) => viewerId.toString() === userId);

        if (!alreadyViewed) {
            status.viewers.push(userId);
            await status.save();

            const updatedStatus = await Status.findById(statusId)
                .populate("user", "userName profilePicture")
                .populate("viewers", "userName profilePicture");

            //Emit socket event


            if (req.io && req.socketUserMap) {
                //Brodcast to all connecting users except creator
                const statusOwnerSocketId = req.socketUserMap.get(status.user._id.to_string());
                if (statusOwnerSocketId) {
                    const viewData = {
                        statusId,
                        viewerId: userId,
                        totalViewers: updatedStatus.viewers.length,
                        viewers: updatedStatus.viewers
                    }

                    res.io.to(statusOwnerSocketId).emit("status_viewed", viewData);
                }
                else {
                    console.log("status owner is not connected");
                }

            }

            return res.status(200).json({ message: "status viewed successfully", status: updatedStatus });
        }
        else {
            console.log("user already viewed status");
        }

        return res.status(200).json({ message: "status already viewed", status });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });

    }
}

exports.deleteStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.userId;
    try {
        const status = await Status.findById(statusId);
        if (!status) {
            return res.status(404).json("status not found");
        }
        if (status.user.toString() != userId) {
            return res.status(403).json("Not authorized to delete the status");
        }

        await status.deleteOne();


        //emit event of scoket 

        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId != userId) {
                    req.io.to(socketId).emit("Status_deleted", statusId);
                }

            }
        }

        return res.status(200).json("status deleted successfully");
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });

    }

}
