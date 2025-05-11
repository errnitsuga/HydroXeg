document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'md:hidden p-2 text-gray-700';
    mobileMenuButton.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
    `;
    
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.hidden.md\\:flex');
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu md:hidden absolute top-16 left-0 w-full bg-white shadow-lg';
    mobileMenu.innerHTML = navLinks.innerHTML;
    
    nav.appendChild(mobileMenuButton);
    nav.appendChild(mobileMenu);
    
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });

    // Smooth Scroll for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                // Calculate the offset to account for fixed header
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                mobileMenu.classList.remove('active');
            }
        });
    });

    // Intersection Observer for Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections for animation
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Navbar Scroll Effect
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > lastScrollTop) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = currentScroll;
    });

    // Impact Numbers Animation
    const impactNumbers = document.querySelectorAll('.impact-number');
    const impactObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const number = entry.target;
                const targetValue = parseInt(number.textContent);
                let currentValue = 0;
                const duration = 2000; // 2 seconds
                const increment = targetValue / (duration / 16); // 60fps
                
                const updateNumber = () => {
                    currentValue += increment;
                    if (currentValue < targetValue) {
                        number.textContent = Math.floor(currentValue);
                        requestAnimationFrame(updateNumber);
                    } else {
                        number.textContent = targetValue;
                    }
                };
                
                updateNumber();
                impactObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    impactNumbers.forEach(number => impactObserver.observe(number));

    // Auth Modal Functions
    window.showAuthModal = (type) => {
        const modal = document.getElementById('auth-modal');
        const title = document.getElementById('auth-modal-title');
        const form = document.getElementById('auth-form');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        if (type === 'signin') {
            title.textContent = 'Sign In';
        } else {
            title.textContent = 'Sign Up';
        }
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            
            try {
                if (type === 'signin') {
                    await authFunctions.signIn(email, password);
                } else {
                    await authFunctions.signUp(email, password);
                }
                hideAuthModal();
            } catch (error) {
                alert(error.message);
            }
        };
    };
    
    window.hideAuthModal = () => {
        const modal = document.getElementById('auth-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.getElementById('auth-form').reset();
    };
    
    // Close modal when clicking outside
    document.getElementById('auth-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            hideAuthModal();
        }
    });

    // Bin data with materials
    const bins = [
        {
            id: 1,
            name: 'Trash Bin 1',
            location: 'Canteen Area',
            capacity: 47,
            lastCheck: '3h',
            collections: 12,
            status: 'warning',
            materials: [
                { name: 'Tin Cans', percentage: 35, status: 'good' },
                { name: 'Paper', percentage: 45, status: 'warning' },
                { name: 'Metal', percentage: 20, status: 'good' },
                { name: 'Glass', percentage: 15, status: 'good' }
            ]
        },
        // Add similar data for bins 2 and 3
    ];

    let selectedBin = null;

    function selectBin(binId) {
        selectedBin = bins.find(bin => bin.id === binId);
        if (selectedBin) {
            showPage('monitoring');
            updateMaterialsDisplay();
        }
    }

    function updateMaterialsDisplay() {
        const container = document.getElementById('materials-container');
        if (!container || !selectedBin) return;

        container.innerHTML = selectedBin.materials.map(material => `
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">${material.name}</h3>
                    <span class="px-3 py-1 rounded-full text-sm ${
                        material.status === 'good' ? 'bg-green-100 text-green-800' :
                        material.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }">${material.status}</span>
                </div>
                <div class="relative pt-1">
                    <div class="flex mb-2 items-center justify-between">
                        <div>
                            <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                                material.percentage < 30 ? 'text-green-600 bg-green-200' :
                                material.percentage < 70 ? 'text-yellow-600 bg-yellow-200' :
                                'text-red-600 bg-red-200'
                            }">
                                ${material.percentage}%
                            </span>
                        </div>
                        <button onclick="toggleModal(true)" class="text-sm text-blue-600 hover:text-blue-800">
                            Maintenance
                        </button>
                    </div>
                    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div style="width:${material.percentage}%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                            material.percentage < 30 ? 'bg-green-500' :
                            material.percentage < 70 ? 'bg-yellow-500' :
                            'bg-red-500'
                        }"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function toggleModal(show) {
        const modal = document.getElementById('maintenance-modal');
        if (!modal) return;
        
        if (show) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    function handleMaintenanceAction() {
        // Show success message
        const modal = document.getElementById('maintenance-modal');
        if (!modal) return;
        
        modal.querySelector('.mb-5').innerHTML = `
            <svg class="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p class="text-center text-gray-600">Maintenance action completed successfully!</p>
        `;
        
        // Hide modal after 2 seconds
        setTimeout(() => {
            toggleModal(false);
            // Reset modal content
            setTimeout(() => {
                modal.querySelector('.mb-5').innerHTML = `
                    <svg class="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <p class="text-center text-gray-600">Are you sure you want to perform this maintenance action?</p>
                `;
            }, 500);
        }, 2000);
    }
}); 