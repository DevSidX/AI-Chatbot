const chatBody = document.querySelector('.chat-body');
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");

// API Setup
const API_KEY = "AIzaSyBHfForREVK0weQfFjDIbGt9j417hhtVhY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
};

// Create message element
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add('message', ...classes);
    div.innerHTML = content;
    return div;
};

// Generate bot response
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector('.message-text');

    // Construct parts array with message text
    const parts = [{ text: userData.message }];

    // If file is attached, add it as inline_data
    if (userData.file.data && userData.file.mime_type) {
        parts.push({
            inline_data: {
                mime_type: userData.file.mime_type,
                data: userData.file.data
            }
        });
    }

    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: parts
            }]
        })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error?.message || "API request failed");

        const apiResponsetext = data.candidates[0].content.parts[0].text
            .replace(/^\s*\*\s*/gm, '')         
            .replace(/\*\*(.*?)\*\*/g, '$1')    
            .replace(/\*(.*?)\*/g, '$1')        
            .trim();


        messageElement.innerHTML = apiResponsetext;
    } catch (error) {
        console.error("Bot response error:", error);
        messageElement.innerHTML = "<i>Error getting response.</i>";
        messageElement.style.color = "ff0000";
    } finally {
        userData.file = {};
        incomingMessageDiv.classList.remove('thinking');
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

        // Clear file after use
        userData.file = {
            data: null,
            mime_type: null
        };
    }
};

// Handle user message
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();

    if (!userData.message) return;

    // Create and display user message
    const messageContent = `
    <div class="message-text">${userData.message}</div>
    ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" style="max-width: 200px; border-radius: 8px;" />` : ""}
`;

    const outgoingMessageDiv = createMessageElement(messageContent, 'user-message');
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    // Simulate bot typing
    setTimeout(() => {
        const messageContent = `
            <span class="bot-avatar material-symbols-outlined">smart_toy</span>
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;

        const incomingMessageDiv = createMessageElement(messageContent, 'bot-message', 'thinking');
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
        generateBotResponse(incomingMessageDiv);
    }, 600);
};

// Enter key to send message
messageInput.addEventListener('keydown', (e) => {
    const userMessage = e.target.value.trim();
    if (e.key === "Enter" && userMessage) {
        e.preventDefault();
        handleOutgoingMessage(e);
        messageInput.value = ""; // Clear input
    }
});

// Send button click
sendMessageButton.addEventListener('click', (e) => {
    handleOutgoingMessage(e);
    messageInput.value = ""; // Clear input
});

// File input change handler
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64String = e.target.result.split(",")[1];
        userData.file = {
            data: base64String,
            mime_type: file.type
        };
        fileInput.value = "";
    };
    reader.readAsDataURL(file);
});

// Trigger file input when custom button clicked
document.querySelector("#file-upload-btn").addEventListener("click", () => {
    fileInput.click();
});
