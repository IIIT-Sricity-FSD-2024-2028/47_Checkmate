document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navbar & Active States
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        // Sticky Navbar styling
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active highlighted nav link detection via scroll position
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 250)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // 2. Smooth Scrolling to Sections
    document.querySelectorAll('.nav-links a, a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const getHref = this.getAttribute('href');
            if(getHref.startsWith('#') && getHref.length > 1) {
                e.preventDefault();
                const targetId = getHref;
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Offset for the fixed nav
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 3. Scroll Trigger Animations via Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
        observer.observe(el);
    });

    // 4. Fetch and render open recruitments
    const API_BASE = window.CHECKMATE_API_BASE || 'http://localhost:3000/api';
    fetch(`${API_BASE}/state/recruitments`, {
        headers: {
            'x-role': 'client'
        }
    })
        .then(res => {
            if (!res.ok) throw new Error('API Error');
            return res.json();
        })
        .then(jobs => {
            const list = document.getElementById('footerRecruitmentsList');
            if (!list) return;
            if (!Array.isArray(jobs) || jobs.length === 0) {
                list.innerHTML = '<li><span style="color:rgba(255,255,255,0.5);font-size:14px;">No open positions at the moment.</span></li>';
                return;
            }
            // Store jobs globally for modal access
            window.__openRecruitments = jobs;
            
            list.innerHTML = jobs.map(job => 
                `<li><a href="#" onclick="openJobModal('${job.id}'); return false;">${job.position} <span style="font-size:11px;opacity:0.7;">(${job.location})</span></a></li>`
            ).join('');
        })
        .catch(err => {
            console.error('Failed to load recruitments', err);
            const list = document.getElementById('footerRecruitmentsList');
            if (list) list.innerHTML = '<li><span style="color:rgba(255,255,255,0.5);font-size:14px;">Unable to load open positions.</span></li>';
        });

    // Close Job Modal
    document.getElementById('closeJobModal')?.addEventListener('click', () => {
        document.getElementById('jobModal').style.display = 'none';
    });
});

function openJobModal(jobId) {
    if (!window.__openRecruitments) return;
    const job = window.__openRecruitments.find(j => j.id === jobId);
    if (!job) return;

    document.getElementById('jobModalPosition').textContent = job.position;
    document.getElementById('jobModalLocation').textContent = job.location;
    document.getElementById('jobModalType').textContent = job.type;
    document.getElementById('jobModalSalary').textContent = job.salary;
    document.getElementById('jobModalDesc').textContent = job.description || 'No detailed description provided.';
    
    document.getElementById('jobModal').style.display = 'flex';
}
