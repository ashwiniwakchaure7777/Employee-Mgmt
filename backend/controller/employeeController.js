import catchAsyncError from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Employee } from "../models/employeeSchema.js";
import cloudinary from "cloudinary";

export const addNewEmployee = catchAsyncError(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Employee avatar required!", 400));
  }
  const { employeeAvatar } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowedFormats.includes(employeeAvatar.mimetype)) {
    return next(new ErrorHandler("File format not supported", 400));
  }
  // console.log(req);
  const { name, email, phone, gender, designation, course } = req.body;
  if (!name || !email || !phone || !gender || !designation || !course) {
    return next(new ErrorHandler("Please fill full form", 400));
  }

  const isRegistered = await Employee.findOne({ email });
  if (isRegistered) {
    return next(
      new ErrorHandler(`${isRegistered} with this email already exist!`)
    );
  }

  const cloudinaryResponse = await cloudinary.uploader.upload(
    employeeAvatar.tempFilePath
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary Error:",
      cloudinary.error || "Unknown Cloudinary Error"
    );
  }

  const employee = await Employee.create({
    name,
    email,
    phone,
    gender,
    designation,
    course,
    employeeAvatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });
  res.status(200).json({
    success: true,
    message: "New Employee registered!",
  });
});

export const getAllEmployee = catchAsyncError(async (req, res, next) => {
  try {
    const employee = await Employee.find();
    console.log(employee);
    res.status(200).json(employee);
  } catch (error) {
    return next(new ErrorHandler("Employee data not found", 404));
  }
});

export const getEmployeeDetails = catchAsyncError(async (req, res, next) => {
  
  const id = req.params.id;
  const employee = await Employee.findById(id);
  if (!employee) {
    return next(new ErrorHandler("User no exists", 404));
  }
  res.status(200).json({ success: true, employee });
});

export const updateEmployee = catchAsyncError(async (req, res, next) => {
  try {
    const id = req.params.id; // Assuming you're updating based on the email
    const updateData = req.body; // The data you want to update
    console.log(updateData);
 
    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id: id }, // Find employee by this condition
      { $set: updateData }, // Update the document with this data
      { new: true } // Return the updated document and run validators
    );
    console.log(updatedEmployee);
    if (!updatedEmployee) {
      return next(new ErrorHandler("Employee not found", 404));
    }

    res.json({ message: "Employee updated successfully", updatedEmployee });
  } catch (error) {
    return next(new ErrorHandler("Server error", 500));
  }
});

export const deleteEmployee = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const userExist = await Employee.findById(id);
  if (!userExist) {
    return next(new ErrorHandler("User no exists", 404));
  }

  await Employee.findByIdAndDelete(id);

  return res.status(200).json({ msg: "User deleted successfully" });
});
