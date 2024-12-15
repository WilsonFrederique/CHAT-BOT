const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggesting-list .suggesting");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;

// Api configuration
const API_KEY = "AIzaSyBnCUXKXcIrae6Oa976fOlL8lqjGP6TwHg";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML);
        }
        chatList.scrollTo(0, chatList.scrollHeight);
    }, 75)
}

const generateAPIResponse = async (incomingMessageDiv) => {

    const textElement = incomingMessageDiv.querySelector(".text"); // Get Text element

    try{
        const response = await fetch(API_URL, {
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);
        
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');

        // console.log(apiResponse)
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    }catch(error){
        isResponseGenerating = false;
        // console.log(error);
        textElement.innerText = error.message;
        textElement.classList.add("error");
    }finally{
        incomingMessageDiv.classList.remove("loading");
    }

}

// Show loading animation while waiting for the api response
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                        <i class="color-icon fa-solid fa-robot avatar-animate"></i>
                        <p class="text"></p>
                        <div class="loading-indicator">
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                        </div>
                    </div>
                    <span onclick="copyMessage(this)"><i class="icon fa-regular fa-copy"></i></span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0, chatList.scrollHeight);
    generateAPIResponse(incomingMessageDiv);

}

const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);

    copyIcon.innerText = "..."; // Show tick icon

    setTimeout(() => copyIcon.innerHTML = `<i class="icon fa-solid fa-check"></i>`, 1000); //Revert icon after 1 second
}

const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return; // Exit if there is no message

    isResponseGenerating = true;

    // console.log(userMessage);
    const html = `<div class="message-content">
                        <i class='bx bx-user avatar'></i>
                        <p class="text"></p>
                    </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // Clear input field
    chatList.scrollTo(0, chatList.scrollHeight);
    document.body.classList.add("hide-header");
    setTimeout(showLoadingAnimation, 500);
}


const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight);

    const isLight = (localStorage.getItem("themeColor") === "light_mode");
    document.body.classList.toggle("light_mode", isLight);
};
loadLocalstorageData();

suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    // On convertit en chaîne "light_mode" ou "dark_mode" pour le stockage
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
});

// --- Message confirme delete ---
deleteChatButton.addEventListener("click", () => {
    if(confirm("Êtes-vous sûr de vouloir supprimer tous les messages ?")){
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
});

// Prevent default form submission and handle outgoint chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handleOutgoingChat();
});