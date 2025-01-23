import "./detail.css";
import { useUserStore } from "../../lib/userStore";
import { auth } from "../../lib/firebase";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { onSnapshot } from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore ";


const Details = () => {
  const { currentUser } = useUserStore();
  const { chatID, user } = useChatStore();
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [sharedVideos, setSharedVideos] = useState([]); // Added state for videos
  const [sharedFiles, setSharedFiles] = useState([]);
  const [showMedia, setShowMedia] = useState(true); // Renamed state for showing media
  const [showFiles, setShowFiles] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Fetch shared media (photos and videos)
  useEffect(() => {
    if (!currentUser || !chatID) return;

    const fetchChatData = async () => {
      try {
        const chatRef = doc(db, "chats", chatID);
        const unsubscribe = onSnapshot(chatRef, (chatSnap) => {
          if (!chatSnap.exists()) {
            setSharedPhotos([]);
            setSharedVideos([]); // Clear videos
            setSharedFiles([]);
            return;
          }

          const chatData = chatSnap.data();
          const messages = chatData.messages || [];

          const photos = messages
            .filter((message) => message.img)
            .map((message) => ({
              url: message.img,
              name: message.text || "Shared Image",
              type: 'photo',
            }));

          const videos = messages
            .filter((message) => message.video) // Filter for videos
            .map((message) => ({
              url: message.video,
              name: message.text || "Shared Video",
              type: 'video',
            }));

          const files = messages
            .filter((message) => message.file)
            .map((message) => ({
              url: message.file.url,
              name: message.file.name || "Untitled File",
            }));

          setSharedPhotos(photos);
          setSharedVideos(videos); // Update videos
          setSharedFiles(files);
        });

        return () => {
          unsubscribe();
          setSharedPhotos([]); // Clear photos when switching chats
          setSharedVideos([]); // Clear videos when switching chats
          setSharedFiles([]);  // Clear files when switching chats
        };
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }
    };

    fetchChatData();
  }, [currentUser, chatID]);
  

  // Fetch group members if it's a group chat
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!chatID || !user?.members) return;

      try {
        setIsLoadingMembers(true);
        const memberDetails = await Promise.all(
          user.members.map(async (memberId) => {
            const memberRef = doc(db, "users", memberId);
            const memberSnap = await getDoc(memberRef);
            return memberSnap.exists() ? memberSnap.data().name : "Unknown User";
          })
        );
        setMembers(memberDetails);
      } catch (error) {
        console.error("Error fetching group members:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    if (user?.members) {
      fetchGroupMembers();
    }
  }, [chatID, user]);

  // Fetch block status when the component mounts
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!currentUser?.uid || !user?.uid) return;

      try {
        const blockedRef = doc(db, "blockedUsers", currentUser.uid);
        const blockedSnap = await getDoc(blockedRef);

        if (blockedSnap.exists()) {
          const blockedList = blockedSnap.data().blocked || [];
          setIsBlocked(blockedList.includes(user.uid));
        } else {
          setIsBlocked(false);
        }
      } catch (error) {
        console.error("Error checking block status:", error);
      }
    };

    checkBlockStatus();
  }, [currentUser?.uid, user?.uid]);

  // Block user function
  const handleBlockUser = async () => {
    if (!user?.uid || !currentUser?.uid) return;

    try {
      const blockedRef = doc(db, "blockedUsers", currentUser.uid);
      const blockedSnap = await getDoc(blockedRef);

      if (!blockedSnap.exists()) {
        await setDoc(blockedRef, { blocked: [user.uid] });
      } else {
        await updateDoc(blockedRef, {
          blocked: arrayUnion(user.uid),
        });
      }

      setIsBlocked(true);
      setBlockModalOpen(false); // Close the modal after blocking
      console.log(`User ${user.uid} blocked successfully.`);
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  // Unblock user function
  const handleUnblockUser = async () => {
    if (!user?.uid || !currentUser?.uid) return;

    try {
      const blockedRef = doc(db, "blockedUsers", currentUser.uid);
      await updateDoc(blockedRef, {
        blocked: arrayRemove(user.uid),
      });

      setIsBlocked(false);
      setUnblockModalOpen(false); // Close the modal after unblocking
      console.log(`User ${user.uid} unblocked successfully.`);
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      console.log("User logged out");
    });
  };

  const openModal = (mediaUrl) => {
    setSelectedMedia(mediaUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedMedia(null);
    setIsModalOpen(false);
  };

  return (
    <div className="detail">
      <div className="user">
      <img src={user?.avatar || "./avatar.png"} alt="User avatar" />
      <h2>{user?.name || "Chat Partner"}</h2>
      {/* Display email only if it's not a group chat */}
      {!user?.members && <p>{user?.email || "No email available"}</p>}
    </div>

      <div className="info">
        {/* Group Members Section */}
        {user?.members && (
          <div className="members">
            <h3>Members ({members.length})</h3>
            {isLoadingMembers ? (
              <p>Loading members...</p>
            ) : (
              <ul>
                {members.map((memberName, index) => (
                  <li key={index}>
                    <img src="./avatar.png" alt="Member avatar" />
                    <span>{memberName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Shared Media Section */}
        <div className="option">
          <div className="title" onClick={() => setShowMedia(!showMedia)}>
            <span>Shared Media</span>
            <img src={showMedia ? "./arrowDown.png" : "./arrowUp.png"} alt="Toggle" />
          </div>

          {showMedia && (
            <div className="media">
              {sharedPhotos.length > 0 || sharedVideos.length > 0 ? (
                <>
                  {sharedPhotos.map((photo, index) => (
                    <div className="photoItem" key={index} onClick={() => openModal(photo.url)}>
                      <div className="photoDetail">
                        <img src={photo.url} alt="Shared" />
                        <span>{photo.name}</span>
                      </div>
                    </div>
                  ))}

                  {sharedVideos.map((video, index) => (
                    <div className="mediaItem" key={index} onClick={() => openModal(video.url)}>
                      <div className="mediaDetail">
                        <video src={video.url} controls />
                        <span>{video.name}</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p>No media shared yet</p>
              )}
            </div>
          )}
        </div>

        {/* Shared Files Section */}
        <div className="option">
          <div className="title" onClick={() => setShowFiles(!showFiles)}>
            <span>Shared Files</span>
            <img src={showFiles ? "./arrowDown.png" : "./arrowUp.png"} alt="Toggle" />
          </div>

          {showFiles && (
            <div className="files">
              {sharedFiles.length > 0 ? (
                sharedFiles.map((file, index) => (
                  <div className="fileItem" key={index}>
                    <div className="fileIcon">
                      <img src="./icon.png" alt="File Icon" />
                      <a href={file.url} download target="_blank" rel="noopener noreferrer" className="fileLink">
                        {file.name}
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p>No files shared yet</p>
              )}
            </div>
          )}
        </div>

        <button onClick={() => (isBlocked ? setUnblockModalOpen(true) : setBlockModalOpen(true))}>
          {isBlocked ? "Unblock User" : "Block User"}
        </button>

        <button className="logout" onClick={handleLogout}>
          Log Out
        </button>
      </div>

      {/* Modal for blocking user */}
      {blockModalOpen && (
        <div className="modal" onClick={() => setBlockModalOpen(false)}>
          <div className="BlockmodalContent" onClick={(e) => e.stopPropagation()}>
            <p>If you block this person, you won't be able to message them. Are you sure?</p>
            <button onClick={handleBlockUser}>Block</button>
            <button onClick={() => setBlockModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Modal for unblocking user */}
      {unblockModalOpen && (
        <div className="modal" onClick={() => setUnblockModalOpen(false)}>
          <div className="BlockmodalContent" onClick={(e) => e.stopPropagation()}>
            <p>If you unblock {user?.name || "this person"}, you will be able to message them again. Are you sure?</p>
            <button onClick={handleUnblockUser}>Unblock</button>
            <button onClick={() => setUnblockModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Modal for viewing media */}
      {isModalOpen && (
  <div className="modal" onClick={closeModal}>
    <div className="modalContents" onClick={(e) => e.stopPropagation()}>
      {selectedMedia.endsWith(".mp4") || selectedMedia.endsWith(".webm") ? (
        <div className="videoPlayer">
          <video src={selectedMedia} controls autoPlay />
        </div>
      ) : (
        <img src={selectedMedia} alt="Full View" />
      )}
    </div>
    <button className="closeButton" onClick={closeModal}>×</button>
  </div>
)}
    </div>
  );
};

export default Details;
