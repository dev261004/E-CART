import cloudinary from "../config/cloudinary";

export const uploadToCloudinary = async (fileBuffer: Buffer, folder: string) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(fileBuffer);
  });
};

export const uploadMultipleToCloudinary = async (files: Express.Multer.File[], folder: string) => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer, folder));
  return await Promise.all(uploadPromises);
};
  