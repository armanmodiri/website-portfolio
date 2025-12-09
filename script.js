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
    // 1. Switch to the blog tab
    switchTab('blog');

    // 2. Find the specific post element
    const targetPost = document.getElementById(`post-${id}`);
    
    if (targetPost) {
        // 3. Open it (if not already open)
        if (!targetPost.classList.contains('active')) {
            targetPost.classList.add('active');
        }
        
        // 4. Scroll to it smoothly
        setTimeout(() => {
            targetPost.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// --- ACCORDION BLOG LOADER ---
function loadBlogPosts() {
    const blogContainer = document.getElementById("blog-feed-container");
    fetch("posts.json")
        .then(response => response.json())
        .then(posts => {
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
                
                // NEW: Assign a unique ID to each post so we can find it later
                article.id = `post-${post.id}`;
                
                article.onclick = function() {
                    this.classList.toggle("active");
                };

                article.innerHTML = `
                    <div class="log-header">
                        <span class="log-title">${post.title}</span>
                        <span class="log-icon">+</span>
                    </div>
                    <div class="log-body">
                        <span class="log-date">${post.date}</span>
                        ${imageHTML}
                        <div class="log-content">${post.content}</div>
                    </div>
                `;
                blogContainer.appendChild(article);
            });

            // NEW: Check URL for ?post=ID and open it automatically
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('post');
            if (postId) {
                openPost(postId);
            }
        })
        .catch(error => {
            console.error(error);
            blogContainer.innerHTML = "<p>Trail not found (json load error).</p>";
        });
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
                
                // NEW: Updated onclick to call openPost(id)
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
function toggleModal() {
    const modal = document.getElementById("sys-modal");
    if (!modal.classList.contains("show")) {
        modal.style.display = "flex";
        const count = document.getElementById("counter-display").innerText;
        
        // Safety check if the element exists before trying to set it
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
    if (!e || e.target.className === "modal-backdrop" || e.target.className === "close-btn") {
        const modal = document.getElementById("sys-modal");
        modal.classList.remove("show");
        setTimeout(() => {
            modal.style.display = "none";
        }, 400); 
    }
}