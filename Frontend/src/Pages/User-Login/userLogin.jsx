import { useState } from "react";
import userLoginStore from "../../Store/useLoginStore";
import countries from "../../Utils/Countries";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import useUserStore from "../../Store/useUserStore";
import userThemeStore from "../../Store/themeStore";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaArrowLeft, FaChevronDown, FaSpinner, FaUser, FaWhatsapp,FaPlus } from "react-icons/fa";
import { sendOtp, updateUserProfile, verifyOtp } from "../../services/user.service";

//validate schema

const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
      .matches(/^\d+$/, { message: "Phone number must be digits", excludeEmptyString: true })
      .transform((value, originalValue) =>
        originalValue?.trim() === "" ? null : value,
      ),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .email("Please enter valid email")
      .transform((value, originalValue) =>
        originalValue?.trim() === "" ? null : value,
      ),
  })
  .test("at-least-one", "Either email or phone is required", function (value) {
    return !!(value?.phoneNumber || value?.email);
  });

const otpValidationSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "otp must be exactly 6 digits")
    .required("otp id required"),
});

const profileValidationSchema = yup.object().shape({
  username: yup.string().required("username is required"),
  agreed: yup.bool().oneOf([true], "you must aggreeto the terms"),
});

const avatars = [
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe",
];

const Login = () => {
  const { step, setStep, setUserPhoneData, userPhoneData, resetLoginState } =
    userLoginStore();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [serchTerm, setSerchTerm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme } = userThemeStore();
  const [loading,setLoding]=useState(false);

  
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({ resolver: yupResolver(loginValidationSchema) });

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: OtpErrors },
    setValue: setOtpValue,
  } = useForm({ resolver: yupResolver(otpValidationSchema) });

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch,
  } = useForm({ resolver: yupResolver(profileValidationSchema) });

  //to filter countries

  const filterCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(serchTerm.toLowerCase()) ||
      country.dialCode.includes(serchTerm),
  );


  const onLoginSubmit = async(data)=>{
    try{
      setLoding(true);
      setError("");
      const emailValue = data.email?.trim();
      const phoneValue = data.phoneNumber?.trim();

      if(emailValue){
        const response=await sendOtp(null,null,emailValue);
        if(response.status === "success"){
          toast.info("OTP sent to your email");
          setUserPhoneData({ email: emailValue });
          setStep(2);
        }
        return;
      }

      const response=await sendOtp(phoneValue,selectedCountry.dialCode);
      if(response.status ==="success"){
        toast.info("OTP sent to your phone");
        setUserPhoneData({phoneNumber:phoneValue,phoneSuffix:selectedCountry.dialCode});
        setStep(2);
      }
    }
    catch(error){
            console.log(error);
            setError(error.message || "failed to send otp");
          }
          finally{
            setLoding(false);
          }
  }

  const onOtpSumbit = async () =>{
    try{
      setLoding(true);
      if(!userPhoneData){
        throw new Error("Phone or email data is missing");
      }
      const otpString=otp.join("");
      let response;
      if(userPhoneData?.email){
        response=await verifyOtp(null,null,otpString,userPhoneData.email)
      }
      else{
        response=await verifyOtp(userPhoneData.phoneNumber,userPhoneData.phoneSuffix,otpString)
      }

      if(response.status === "success"){
        toast.success("OTP verify successfully");
        console.log(response);
        const user= response.data?.user;
        if(user?.userName && user?.profilePicture){
          setUser(user);
          toast.success("welcome back to whatsapp");
          navigate("/");
          resetLoginState();
        }
        else{
          setStep(3);
        }
      }
    }
    catch(error){
      console.log(error);
      setError(error.message || "failed to verify otp")
    }
    finally{
      setLoding(false);
    }
  }

  const handleFileChange=(e)=>{
    const file=e.target.files[0];
    if(file){
      setProfilePicture(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  }

  const onProfileSubmit = async (data)=>{
    try{
      setLoding(true);
      const formData=new FormData();
      formData.append("username",data.username);
      formData.append("agreed",data.agreed);
      if(profilePicture){
        formData.append("media",profilePicture)
      }
      else{
        formData.append("profilePicture",selectedAvatar);
      }

      await updateUserProfile(formData);
      toast.success("welcome back to whatsapp");
      navigate("/");
      resetLoginState();
    }
    catch(error){
      console.log(error);
      setError(error.message || "failed to update user")

    }finally{
      setLoding(false);
    }
  }

  const handleOtpChange = (index,value)=>{
    const newOtp = [...otp];
    newOtp[index]=value;
    setOtp(newOtp);
    setOtpValue("otp",newOtp.join(""));
    if(value && index<5){
      document.getElementById(`otp-${index+1}`)?.focus();
    }

  }

  // 1. Rename to Capitalized 'ProgressBar'
  const ProgressBar = () => (
    <div
      className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}
    >
      <div
        className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
        // 2. Fixed the extra '}' typo here
        style={{ width: `${(step / 3) * 100}%` }}
      ></div>
    </div>
  );

const handleBack= ()=>{
  setStep(1);
  setUserPhoneData(null);
  setOtp(["","","","","",""]);
  setError(null);
}
  return (
 
<div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gradient-to-br from-green-400 to-blue-500"} flex items-center justify-center p-4 overflow-hidden`}>
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"} p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        duration: 0.2,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"
    >
      <FaWhatsapp className="w-16 h-16 text-white" />
    </motion.div>

    <h1 className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
      WhatsApp Login
    </h1>

    <ProgressBar />

    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
    
    {step === 1 && (
      <form className="space-y-4" onSubmit={handleLoginSubmit(onLoginSubmit)}>
        <p className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-4`}>
          Enter your phone number to receive OTP
        </p>

        {/* --- PHONE FIELD BLOCK --- */}
        <div className="space-y-1">
          <div className="flex relative items-center h-11">
            {/* Country Dropdown Column */}
            <div className="w-1/3 h-full relative">
              <button
                type="button"
                className={`w-full h-full flex items-center justify-between px-3 text-sm font-medium border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 z-20
                  ${theme === "dark" ? "text-white bg-gray-700 border-gray-600 hover:bg-gray-600" : "text-gray-900 bg-gray-100 border-gray-300 hover:bg-gray-200"}`}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="truncate">
                  {selectedCountry.flag} {selectedCountry.dialCode}
                </span>
                <FaChevronDown className="ml-1 flex-shrink-0 text-xs text-gray-400" />
              </button>

              {/* Country Selection Menu Modal */}
              {showDropdown && (
                <div className={`absolute z-30 w-64 mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto left-0
                  ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                >
                  <div className={`sticky top-0 ${theme === "dark" ? "bg-gray-700" : "bg-white"} p-2 border-b ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
                    <input
                      type="text"
                      placeholder="Search countries"
                      value={serchTerm}
                      onChange={(e) => setSerchTerm(e.target.value)}
                      className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                        ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"}`}
                    />
                  </div>
                  <div className="flex flex-col">
                    {filterCountries.length > 0 ? (
                      filterCountries.map((country) => (
                        <button
                          key={country.name}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowDropdown(false);
                            setSerchTerm("");
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center space-x-2
                            ${theme === "dark" ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          <span>{country.flag}</span>
                          <span className="font-semibold text-xs text-gray-400 w-10">{country.dialCode}</span>
                          <span className="truncate">{country.name}</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-center py-3 text-gray-400">No results found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Input Element Box */}
            <input
              type="text"
              {...loginRegister("phoneNumber")}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="phone number"
              className={`w-2/3 h-full px-4 border rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 
                ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} 
                ${loginErrors.phoneNumber ? "border-red-500" : ""}`}
            />
          </div>
          {loginErrors.phoneNumber && (
            <p className="text-red-500 text-xs mt-1">{loginErrors.phoneNumber.message}</p>
          )}
        </div>

        {/* --- STRUCTURAL TEXT DIVIDER --- */}
        <div className="flex items-center my-5">
          <div className={`flex-grow h-px ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
          <span className="mx-3 text-gray-400 text-xs font-semibold uppercase tracking-wider">or</span>
          <div className={`flex-grow h-px ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
        </div>

        {/* --- EMAIL FIELD BLOCK --- */}
        <div className="space-y-1">
          <div className={`flex items-center border rounded-lg h-11 px-3 focus-within:ring-2 focus-within:ring-green-500
            ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}
            ${loginErrors.email ? "border-red-500" : ""}`}
          >
            <FaUser className="text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="email"
              {...loginRegister("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="w-full h-full bg-transparent text-sm focus:outline-none text-gray-900 dark:text-black"
            />
          </div>
          {loginErrors.email && (
            <p className="text-red-500 text-xs mt-1">{loginErrors.email.message}</p>
          )}
        </div>

        {/* --- SUBMIT CTA BUTTON --- */}
        <button
          type="submit"
          className="w-full h-11 bg-green-500 text-white rounded-md font-medium text-sm hover:bg-green-600 transition flex items-center justify-center shadow-md shadow-green-500/10 mt-6"
        >
          {loading ? <FaSpinner className="animate-spin w-4 h-4" /> : "Send OTP"}
        </button>
      </form>
    )}

    {step === 2 && (
      <form onSubmit={handleOtpSubmit(onOtpSumbit)} className="space-y-4">
        <p className={`text-center ${theme ==="Dark"? "text-gray-300":"text-gray-600"} md-4`}>
          please enter the 6-digit OTP send to your {userPhoneData ? userPhoneData.phoneSuffix:"Email"}{""}
          {userPhoneData.phoneNumber && userPhoneData?.phoneNumber}
        </p>
        <div className="flex justify-center gap-2">
          {otp.map((digit,index)=>(
            <input
            key={index}
            id={`otp-${index}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e)=>handleOtpChange(index,e.target.value)}
            className={`w-12 h-12 text-center border ${theme==="dark"?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              OtpErrors.otp?"border-red-500":""
            }`}
            />
          ))}
        </div>
         {OtpErrors.otp && (
            <p className="text-red-500 text-xs mt-1">{OtpErrors.otp.message}</p>
          )}

          <button
          type="submit"
          className="w-full h-11 bg-green-500 text-white rounded-md font-medium text-sm hover:bg-green-600 transition flex items-center justify-center shadow-md shadow-green-500/10 mt-6"
        >
          {loading ? <FaSpinner className="animate-spin w-4 h-4" /> : "Verify Otp"}
        </button>

        <button
         type="button"
         onClick={handleBack}
         className={`w-full mt-2 ${theme ==="dark"? "bg-gray-700 text-gray-300":"bg-gray-200 text-gray-700"}py-2 rounded-md hover:bg-gray-300 transition items-center justify-center`}
         >
          <FaArrowLeft className="mr-2"></FaArrowLeft>
          wrong number ? Go back
        </button>
      </form>
    )}
    
{step === 3 && (
  <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
    <div className="flex flex-col items-center mb-4">
      
      {/* --- PROFILE PICTURE PREVIEW --- */}
      <div className="relative w-24 h-24 mb-4">
        <img 
          src={profilePicture || selectedAvatar}
          alt="profile"
          className="w-full h-full rounded-full object-cover border-2 border-green-500 p-0.5"
        />
        <label
          htmlFor="profile-picture"
          /* Fixed typo: rounnded-full -> rounded-full */
          className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300 shadow-md"
        >
          <FaPlus className="w-3 h-3" />  
        </label>
        <input
          type="file"
          id="profile-picture"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-500"} mb-3`}>
        Choose an avatar
      </p>

      {/* --- AVATAR SELECTOR LIST --- */}
      <div className="flex flex-wrap justify-center gap-3 max-w-xs mx-auto mb-6">
        {avatars.map((avatar, index) => (
          /* Changed {} to () for an implicit return statement */
          <img
            key={index}
            src={avatar}
            alt={`Avatar ${index + 1}`}
            onClick={() => {
              setSelectedAvatar(avatar);
              setProfilePicture(null); // Clear custom file upload if they pick an avatar instead
            }}
            className={`w-12 h-12 rounded-full cursor-pointer transition duration-200 ease-in-out transform hover:scale-110 object-cover
              ${selectedAvatar === avatar && !profilePicture 
                ? "ring-4 ring-green-500 scale-105" 
                : "opacity-70 hover:opacity-100"
              }`}
          />
        ))}
      </div>

      {/* --- USERNAME INPUT FIELD --- */}
      <div className="w-full space-y-1 text-left">
        <label className={`text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
          userName
        </label>
        <input
          type="text"
          {...profileRegister("username")}
          placeholder="Type your username"
          className={`w-full h-11 px-4 border rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-green-500/20
            ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}
            ${profileErrors.username ? "border-red-500 focus:ring-red-500/10" : "focus:border-green-500"}`}
        />
        {profileErrors.username && (
          <p className="text-red-500 text-xs mt-1">{profileErrors.username.message}</p>
        )}
      </div>

      {/* --- TERMS & CONDITIONS CHECKBOX --- */}
      <div className="w-full text-left mt-4">
        <label className="flex items-start space-x-3 cursor-pointer select-none">
          <input
            type="checkbox"
            {...profileRegister("agreed")}
            className="w-4 h-4 mt-0.5 rounded accent-green-500 border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            I agree to the WhatsApp Terms of Service and Privacy Policy.
          </span>
        </label>
        {profileErrors.agreed && (
          <p className="text-red-500 text-xs mt-1">{profileErrors.agreed.message}</p>
        )}
      </div>

      {/* --- FINISH PROFILE CTA BUTTON --- */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-green-500 hover:bg-green-600 disabled:bg-green-500/60 text-white font-semibold text-sm rounded-xl shadow-md transition active:scale-[0.99] flex items-center justify-center mt-6"
      >
        {loading ? <FaSpinner className="w-4 h-4 animate-spin" /> : "Finish Setup"}
      </button>

    </div>
  </form>
)}

  </motion.div>
</div>



);
};

export default Login;
