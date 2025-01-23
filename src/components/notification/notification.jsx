import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const notification = ({ message }) => {
  // Trigger the toast notification with the passed message
  if (message) {
    toast.success(message); // Use 'toast.success' or other types like 'toast.error', etc.
  }

  return (
    // ToastContainer ensures toast messages are displayed
    <ToastContainer 
      position="top-right" 
      autoClose={3000} 
      hideProgressBar 
      newestOnTop 
      closeOnClick 
      rtl={false} 
      pauseOnFocusLoss 
      draggable 
      pauseOnHover 
    />
  );
};

export default notification;
