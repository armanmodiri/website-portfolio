document.addEventListener("DOMContentLoaded", () => {
    loadBlogPosts();
    loadSidebarPosts();
    initVisitorCounter();
});

// --- VISITOR COUNTER ---
function initVisitorCounter() {
    const counterElement = document.getElementById("counter-display");
    const AZURE_FUNCTION_URL = "YOUR_API_URL_HERE";
    const isProd = false; 
    const DURATION = 2000; 

    if (isProd) {
        fetch(AZURE_FUNCTION_URL)
            .then(res => res.json())
            .then(data => {
                animateValue(counterElement, 0, data.count, DURATION);
            })
            .catch(() => counterElement.innerText = "ERR");
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

// --- ACCORDION BLOG LOADER ---
function loadBlogPosts() {
    const blogContainer = document.getElementById("blog-feed-container");
    fetch("posts.json")
        .then(response => response.json())
        .then(posts => {
            blogContainer.innerHTML = "";
            posts.forEach((post, index) => {
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
                
                // Toggle active class on click for Accordion effect
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
        })
        .catch(error => {
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
                item.innerHTML = `
                    <div class="recent-marker"></div>
                    <a href="#" onclick="switchTab('blog'); return false;" class="recent-link">
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

// --- MODAL CONTROLS (Updated for Transitions) ---
function toggleModal() {
    const modal = document.getElementById("sys-modal");
    if (!modal.classList.contains("show")) {
        // OPEN
        modal.style.display = "flex";
        // Fill data
        const count = document.getElementById("counter-display").innerText;
        document.getElementById("modal-count-display").innerText = count;
        
        // Small delay to allow display:flex to apply
        setTimeout(() => {
            modal.classList.add("show");
        }, 10);
    } else {
        // CLOSE
        closeModal();
    }
}

function closeModal(e) {
    if (!e || e.target.className === "modal-backdrop" || e.target.className === "close-btn") {
        const modal = document.getElementById("sys-modal");
        modal.classList.remove("show");
        setTimeout(() => {
            modal.style.display = "none";
        }, 400); // Match CSS transition time
    }
}