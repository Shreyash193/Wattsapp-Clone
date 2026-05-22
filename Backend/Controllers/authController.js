const optGenerator = require('../Utils/otpGenerator');

//send otp
const otpSend = async (req, res) => {
    const { phone, phoneSuffix, email } = req.body;
    const otp = optGenerator();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    let user;
    try {
        if (email) {
            user = await User.findOne(email);
            if (!user) {
                user = new User({ email });
            }
            user.emailotp = otp;
            user.expiry = expiry;
            await user.save();
            //send otp to email

            return response(res, 200, "OTP sent to email", { email });
        }
        if (!phone || !phoneSuffix) {
            {
                return response(res, 400, "Phone number and suffix are required");
            }

            const fullPhoneNumber = `${phoneSuffix}${phone}`;
            user = await User.findOne({ fullPhoneNumber });
            if (!user) {
                user = new User({ fullPhoneNumber });
            }
            await user.save();
            //send otp to phone number
            return response(res, 200, "OTP sent to phone number", { phone: fullPhoneNumber });
        }
    }
    catch (err) {
        console.error(err);
        return response(res, 500, "Internal server error");
    }
}