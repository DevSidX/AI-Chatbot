const chatBody = document.querySelector('.chat-body');
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

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

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

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
    
    // User response to chat history
    chatHistory.push({
    role: "user",
    parts: [
        { text: userData.message },
        ...(userData.file.data ? [{ inline_data: userData.file }] : [])
    ]
    });
    
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

        const apiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

        // Clean markdown-like syntax
        const cleanedText = apiResponseText
            .replace(/^\s*\*\s*/gm, '')         // Remove leading '* ' at line start
            .replace(/\*\*(.*?)\*\*/g, '$1')    // Remove bold markdown **
            .replace(/\*(.*?)\*/g, '$1')        // Remove italic markdown *
            .trim();

        messageElement.innerHTML = cleanedText;

        // Bot response to chat history
        chatHistory.push({
        role: "model",
        parts: [{ text: apiResponseText} ]
        });

    } catch (error) {
        console.error("Bot response error:", error);
        messageElement.innerHTML = "<i>Error getting response.</i>";
        messageElement.style.color = "#ff0000";
    } finally {
        userData.file = { data: null, mime_type: null };
        incomingMessageDiv.classList.remove('thinking');
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }
};

// Handle outgoing user message
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

    // Clear input and file upload UI
    messageInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");

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
    if (e.key === "Enter" && userMessage && !e.shiftKey && window.innerWidth > 768) {
        e.preventDefault();
        handleOutgoingMessage(e);
    }
});

// Adjust input field dynamically
messageInput.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius =
        messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Send button click
sendMessageButton.addEventListener('click', (e) => {
    handleOutgoingMessage(e);
});

// File input change handler
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        const base64String = e.target.result.split(",")[1];

        // store file data in userData
        userData.file = {
            data: base64String,
            mime_type: file.type
        };
        fileInput.value = "";
    };
    reader.readAsDataURL(file);
});

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
    userData.file = { data: null, mime_type: null };
    fileUploadWrapper.classList.remove("file-uploaded");
});

// Initialize emoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
        const { selectionStart: start, selectionEnd: end } = messageInput;
        messageInput.setRangeText(emoji.native, start, end, "end");
        messageInput.focus();
    },
    onClickOutside: (e) => {
        if (e.target.id === "emoji-picker") {
            document.body.classList.toggle("show-emoji-picker");
        } else {
            document.body.classList.remove("show-emoji-picker");
        }
    }
});

// Append emoji picker to chat form
document.querySelector(".chat-form").appendChild(picker);

// Trigger file input when custom button clicked
document.querySelector("#file-upload-btn").addEventListener("click", () => {
    fileInput.click();
});

// Toggle chatbot visibility
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
