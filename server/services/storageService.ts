import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary and returns the secure URL
 * @param filePath - Path to the file to upload
 * @returns Promise<string> - The secure URL of the uploaded file
 */
export async function uploadFile(filePath: string): Promise<string> {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto', // Automatically detect file type
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}