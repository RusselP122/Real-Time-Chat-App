import { getDownloadURL, uploadBytesResumable, ref } from "firebase/storage";
import { storage } from "./firebase";

const upload = async (file) => {
  const date = new Date();
  const fileName = `${date.getTime()}_${file.name}`; // Unique name using timestamp

  // Determine the folder based on file type
  const fileType = file.type; // MIME type of the file
  const isImage = fileType.startsWith("image/"); // Check if the file is an image
  const folder = isImage ? "images" : "files"; // Set folder based on file type

  const storageRef = ref(storage, `${folder}/${fileName}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
      },
      (error) => {
        console.error("Error during upload:", error);
        reject(`Something went wrong! ${error.code}`);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`File uploaded to ${folder}: ${downloadURL}`);
          resolve(downloadURL);
        } catch (error) {
          reject(`Failed to retrieve download URL: ${error.message}`);
        }
      }
    );
  });
};

export default upload;
