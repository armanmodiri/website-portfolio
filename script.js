document.addEventListener("DOMContentLoaded", () => {
    loadBlogPosts();
    loadSidebarPosts();
    initVisitorCounter();
});

// --- VISITOR COUNTER ---
function initVisitorCounter() {
    const counterElement = document.getElementById("counter-display");
    const AZURE_FUNCTION_URL = "/api/GetVisitorCount";
    const isProd = true; 
    const DURATION = 2000; 

    if (isProd) {
        fetch(AZURE_FUNCTION_URL)
            .then(res => {
                if (!res.ok) throw new Error("API Response not OK");
                return res.json();
            })
            .then(data => {
                const count = data.count || 0;
                animateValue(counterElement, 0, count, DURATION);
            })
            .catch((e) => {
                console.error("Counter Error:", e);
                counterElement.innerText = "ERR";
            });
    } else {
        setTimeout(() => {
            animateValue(counterElement, 0, 1204, DURATION);
        }, 500);
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = end; 
    };
    window.requestAnimationFrame(step);
}

// --- TAB SWITCHER ---
function switchTab(tabName) {
    const resumeView = document.getElementById("resume-view");
    const blogView = document.getElementById("blog-view");
    const buttons = document.querySelectorAll(".tab-btn");

    buttons.forEach(btn => btn.classList.remove("active"));
    resumeView.style.display = "none";
    blogView.style.display = "none";

    if (tabName === "resume") {
        resumeView.style.display = "block";
        buttons[0].classList.add("active");
    } else {
        blogView.style.display = "block";
        buttons[1].classList.add("active");
    }
}

// --- OPEN SPECIFIC POST (DEEP LINKING) ---
function openPost(id) {
    switchTab('blog');
    const targetPost = document.getElementById(`post-${id}`);
    
    if (targetPost) {
        if (!targetPost.classList.contains('active')) {
            togglePost(targetPost);
        }
        
        setTimeout(() => {
            const headerOffset = 80; 
            const elementPosition = targetPost.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;
        
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }, 100);
    }
}

// --- ACCORDION BLOG LOADER ---

function loadBlogPosts() {
    const blogContainer = document.getElementById("blog-feed-container");
    fetch("posts.json")
        .then(response => response.json())
        .then(posts => {
            displayPosts(posts);
        })
        .catch(error => {
            console.error(error);
            blogContainer.innerHTML = "<p>Trail not found (json load error).</p>";
        });
}

function displayPosts(posts) {
    const blogContainer = document.getElementById("blog-feed-container");
    blogContainer.innerHTML = "";

    posts.forEach((post) => {
        let imageHTML = "";
        if (post.image) {
            imageHTML = `
                <div class="log-img-container">
                    <img src="${post.image}" alt="Post Image" class="log-img">
                    ${post.imageCaption ? `<div class="log-caption">${post.imageCaption}</div>` : ''}
                </div>
            `;
        }

        const article = document.createElement("div");
        article.className = "log-entry";
        article.id = `post-${post.id}`;
        
        // Structure: Header has the title and the ICON container
        article.innerHTML = `
            <div class="log-header">
                <span class="log-title">${post.title}</span>
                <div class="log-icon">+</div> 
            </div>
            <div class="log-body">
                <span class="log-date">${post.date}</span>
                ${imageHTML}
                <div class="log-content">${post.content}</div>
            </div>
        `;
        
        // Add click listener ONLY to the header
        const header = article.querySelector(".log-header");
        header.onclick = function() {
            togglePost(article);
        };

        blogContainer.appendChild(article);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    if (postId) {
        openPost(postId);
    }
}

// --- THIS IS THE KEY FUNCTION ---
function togglePost(element) {
    // 1. Toggle the logic class on the Article
    element.classList.toggle("active");
    
    // 2. Find the icon container
    const icon = element.querySelector(".log-icon");
    
    // 3. Swap the Visuals
    if (element.classList.contains("active")) {
        // ACTIVE STATE: Turn into a Red Button
        icon.classList.add("close-btn-graphic");
        // Inject the text and the X
        icon.innerHTML = `<span class="btn-text">Close Entry</span> <span class="btn-x">×</span>`;
    } else {
        // INACTIVE STATE: Go back to being a Plus sign
        icon.classList.remove("close-btn-graphic");
        icon.innerHTML = "+"; 
    }
}

// --- SIDEBAR POSTS LOADER ---
function loadSidebarPosts() {
    const list = document.getElementById("recent-posts-list");
    fetch("posts.json")
        .then(res => res.json())
        .then(posts => {
            list.innerHTML = "";
            const recent = posts.slice(0, 3);
            if (recent.length === 0) {
                list.innerHTML = "<span style='color:#666; font-size:0.8rem;'>No logs found.</span>";
                return;
            }
            recent.forEach(post => {
                const item = document.createElement("div");
                item.className = "recent-entry";
                
                item.innerHTML = `
                    <div class="recent-marker"></div>
                    <a href="#" onclick="openPost(${post.id}); return false;" class="recent-link">
                        ${post.title}
                    </a>
                `;
                list.appendChild(item);
            });
        })
        .catch(err => {
            list.innerHTML = "<span style='color:#666; font-size:0.8rem;'>Offline</span>";
        });
}

// --- MODAL CONTROLS ---

let scrollPosition = 0;

function toggleModal() {
    const modal = document.getElementById("sys-modal");
    
    if (!modal.classList.contains("show")) {
        scrollPosition = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPosition}px`;
        document.body.style.width = '100%'; 
        
        modal.style.display = "flex";
        
        const count = document.getElementById("counter-display").innerText;
        const modalCountDisplay = document.getElementById("modal-count-display");
        if (modalCountDisplay) {
            modalCountDisplay.innerText = count;
        }

        setTimeout(() => {
            modal.classList.add("show");
        }, 10);

    } else {
        closeModal();
    }
}

function closeModal(e) {
    if (e && e.target.className !== "modal-backdrop" && e.target.className !== "close-btn") {
        return; 
    }

    const modal = document.getElementById("sys-modal");
    modal.classList.remove("show");
    
    setTimeout(() => {
        modal.style.display = "none";
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollPosition);
    }, 200); 
}