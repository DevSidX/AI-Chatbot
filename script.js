const chatBody = document.querySelector('.chat-body');
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector('#chatbot-toggler');
const closeChatbot = document.querySelector("#close-chatbot");

const API_KEY = "AIzaSyBHfForREVK0weQfFjDIbGt9j417hhtVhY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file: { data: null, mime_type: null }
};

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// Message creation and bot response functions remain unchanged
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add('message', ...classes);
    div.innerHTML = content;
    return div;
};

const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector('.message-text');
    
    chatHistory.push({
        role: "user",
        parts: [
            { text: userData.message },
            ...(userData.file.data ? [{ inline_data: userData.file }] : [])
        ]
    });
    
    const parts = [{ text: userData.message }];
    if (userData.file.data && userData.file.mime_type) {
        parts.push({
            inline_data: {
                mime_type: userData.file.mime_type,
                data: userData.file.data
            }
        });
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts }] })
        });
        const data = await response.json();
        const apiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
        
        messageElement.innerHTML = apiResponseText
            .replace(/^\s*\*\s*/gm, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .trim();

        chatHistory.push({ role: "model", parts: [{ text: apiResponseText }] });
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

const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    if (!userData.message) return;

    const messageContent = `
        <div class="message-text">${userData.message}</div>
        ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" style="max-width: 200px; border-radius: 8px;" />` : ""}
    `;

    const outgoingMessageDiv = createMessageElement(messageContent, 'user-message');
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    messageInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");

    setTimeout(() => {
        const incomingMessageDiv = createMessageElement(`
            <span class="bot-avatar material-symbols-outlined">smart_toy</span>
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `, 'bot-message', 'thinking');
        
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
        generateBotResponse(incomingMessageDiv);
    }, 600);
};

// Event listeners
messageInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter" && e.target.value.trim() && !e.shiftKey && window.innerWidth > 768) {
        e.preventDefault();
        handleOutgoingMessage(e);
    }
});

messageInput.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius =
        messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

sendMessageButton.addEventListener('click', handleOutgoingMessage);

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        userData.file = {
            data: e.target.result.split(",")[1],
            mime_type: file.type
        };
        fileInput.value = "";
    };
    reader.readAsDataURL(file);
});

fileCancelButton.addEventListener("click", () => {
    userData.file = { data: null, mime_type: null };
    fileUploadWrapper.classList.remove("file-uploaded");
});

// Emoji picker setup
document.querySelector(".chat-form").appendChild(new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
        const { selectionStart: start, selectionEnd: end } = messageInput;
        messageInput.setRangeText(emoji.native, start, end, "end");
        messageInput.focus();
    },
    onClickOutside: (e) => {
        document.body.classList.toggle("show-emoji-picker", e.target.id === "emoji-picker");
    }
}));

document.querySelector("#file-upload-btn").addEventListener("click", () => fileInput.click());

// Navigation functions
function returnToHome() {
    document.querySelector('.chatbot-popup').style.display = 'none';
    document.querySelector('.landing-page').style.display = 'flex';
    document.body.classList.remove('show-chatbot');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

chatbotToggler.addEventListener("click", (e) => {
    document.body.classList.contains('show-chatbot') ? returnToHome() : document.body.classList.add('show-chatbot');
});

closeChatbot.addEventListener("click", returnToHome);

// Initialize landing page
document.addEventListener('DOMContentLoaded', () => {
    const landingPage = document.querySelector('.landing-page');
    const chatbotPopup = document.querySelector('.chatbot-popup');
    
    if (landingPage && chatbotPopup) {
        chatbotPopup.style.display = 'none';
        landingPage.style.display = 'flex';
        
        document.getElementById('launch-chatbot').addEventListener('click', () => {
            landingPage.style.display = 'none';
            chatbotPopup.style.display = 'block';
            document.body.classList.add('show-chatbot');
            chatbotToggler.focus();
        });
    }
});