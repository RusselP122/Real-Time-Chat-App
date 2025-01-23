import "./deleteGroupModal.module.css";

const DeleteGroupModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Delete Group Chat</h3>
        <p>Are you sure you want to delete this group chat? This action cannot be undone.</p>
        <div className="modal-buttons">
          <button className="confirm-button" onClick={onConfirm}>
            Delete
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGroupModal;
