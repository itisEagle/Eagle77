// --- STATE MANAGEMENT ---
        const ADMIN_EMAIL = "sb5846868@gmail.com";

        const DEFAULT_RULES = {
            general: [
                "Minimum Level: 30",
                "No Hackers: Instant Ban & No Refund.",
                "Banned Weapons: Grenade, Double Vector, Mag-7.",
                "Fine for breaking rules: 10 NPR."
            ],
            reporting: [
                "CS Match: Winner/Loser MUST select result.",
                "Screenshot required for CS & Lone Wolf wins.",
                "Wrong remark in payment = No Refund."
            ],
            saturdaySpecial: "Free tournament every Saturday"
        };
        
        // Mock Database
        let db = {
            users: JSON.parse(localStorage.getItem('specialTp_users')) || [],
            tournaments: JSON.parse(localStorage.getItem('specialTp_tournaments')) || [],
            orders: JSON.parse(localStorage.getItem('specialTp_orders')) || [],
            transactions: JSON.parse(localStorage.getItem('specialTp_transactions')) || [],
            paymentRequests: JSON.parse(localStorage.getItem('specialTp_paymentRequests')) || [],
            redeemRequests: JSON.parse(localStorage.getItem('specialTp_redeemRequests')) || [],
            storeItems: JSON.parse(localStorage.getItem('specialTp_storeItems')) || null,
            rules: JSON.parse(localStorage.getItem('specialTp_rules')) || JSON.parse(JSON.stringify(DEFAULT_RULES))
        };

        let currentUser = null;

        // --- INITIALIZATION ---
        function saveDB() {
            localStorage.setItem('specialTp_users', JSON.stringify(db.users));
            localStorage.setItem('specialTp_tournaments', JSON.stringify(db.tournaments));
            localStorage.setItem('specialTp_orders', JSON.stringify(db.orders));
            localStorage.setItem('specialTp_transactions', JSON.stringify(db.transactions));
            localStorage.setItem('specialTp_paymentRequests', JSON.stringify(db.paymentRequests));
            localStorage.setItem('specialTp_redeemRequests', JSON.stringify(db.redeemRequests));
            localStorage.setItem('specialTp_storeItems', JSON.stringify(db.storeItems || null));
            localStorage.setItem('specialTp_rules', JSON.stringify(db.rules));
        }

        function escapeHtml(input) {
            const str = String(input ?? '');
            return str
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }

        function getRulesConfig() {
            const r = db.rules || {};
            return {
                general: Array.isArray(r.general) ? r.general : DEFAULT_RULES.general,
                reporting: Array.isArray(r.reporting) ? r.reporting : DEFAULT_RULES.reporting,
                saturdaySpecial: typeof r.saturdaySpecial === 'string' ? r.saturdaySpecial : DEFAULT_RULES.saturdaySpecial
            };
        }

        function refreshCurrentSection() {
            const active = Array.from(document.querySelectorAll('.nav-btn')).find(btn => btn.classList.contains('text-blue-500'));
            if (active?.dataset?.target) showSection(active.dataset.target);
        }

        // --- AUTH SYSTEM ---
        const emailInput = document.getElementById('auth-email');
        const usernameInput = document.getElementById('auth-username');
        const usernameField = document.getElementById('username-field');
        const confirmPasswordField = document.getElementById('confirm-password-field');

        emailInput.addEventListener('input', () => {
            const email = emailInput.value.trim();
            const user = db.users.find(u => u.email === email);
            if (!user && email.includes('@')) {
                usernameField.classList.remove('hidden');
                confirmPasswordField.classList.remove('hidden');
            } else {
                usernameField.classList.add('hidden');
                confirmPasswordField.classList.add('hidden');
            }
        });

        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('auth-password');
            const icon = document.getElementById('password-toggle-icon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }

        function handleAuth() {
            const email = emailInput.value.trim();
            const password = document.getElementById('auth-password').value;
            
            if (!email) return alert('Please enter email');
            if (!password) return alert('Please enter password');
            
            let user = db.users.find(u => u.email === email);
            
            if (!user) {
                // Register - New User
                const username = usernameInput.value.trim();
                const confirmPassword = document.getElementById('auth-confirm-password').value;
                
                if (!username) return alert('Please choose a username');
                
                // Validate password
                if (password.length < 6) {
                    return alert('Password must be at least 6 characters long.');
                }
                
                if (password !== confirmPassword) {
                    return alert('Passwords do not match!');
                }
                
                // Check for duplicate username (case-insensitive)
                const usernameExists = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
                if (usernameExists) {
                    return alert('This username is already taken. Please choose another one.');
                }
                
                user = {
                    id: Date.now(),
                    email: email,
                    password: password, // Store password
                    username: username,
                    stones: (email === ADMIN_EMAIL) ? 999999 : 0,
                    avatar: 'https://ui-avatars.com/api/?background=3b82f6&color=fff&name=' + username,
                    joinedAt: new Date().toISOString(),
                    role: (email === ADMIN_EMAIL) ? 'admin' : 'user'
                };
                db.users.push(user);
                saveDB();
                
                alert('✅ Account created successfully! Welcome to Special TP.');
            } else {
                // Login - Existing User
                if (user.password && user.password !== password) {
                    return alert('❌ Incorrect password! Please try again.');
                }
                
                // If user doesn't have password yet (old account), set it now
                if (!user.password) {
                    const userIndex = db.users.findIndex(u => u.id === user.id);
                    if (userIndex !== -1) {
                        db.users[userIndex].password = password;
                        saveDB();
                    }
                }
            }
            
            loginUser(user);
        }

        function loginUser(user) {
            currentUser = user;

            // ADMIN UNLIMITED STONES: Reset to max on login
            if (currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin') {
                currentUser.stones = 999999;
                const idx = db.users.findIndex(u => u.id === currentUser.id);
                if(idx !== -1) {
                    db.users[idx].stones = 999999;
                    saveDB();
                }
            }

            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            document.getElementById('app-container').classList.add('flex');
            
            updateHeader();
            showSection('home');
        }

        function updateHeader() {
            if(!currentUser) return;
            document.getElementById('header-username').innerText = currentUser.username;
            document.getElementById('header-stones').innerText = currentUser.stones;
            document.getElementById('header-id').innerText = currentUser.ffUID ? currentUser.ffUID.slice(-4) : currentUser.id.toString().slice(-4);
            document.getElementById('header-avatar').innerHTML = `<img src="${currentUser.avatar}" class="w-full h-full rounded-full object-cover">`;
        }

        // --- NAVIGATION ---
        function showSection(sectionId) {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = ''; // Clear current content

            // Update Nav Icons
            document.querySelectorAll('.nav-btn').forEach(btn => {
                if(btn.dataset.target === sectionId) {
                    btn.classList.add('text-blue-500');
                    btn.classList.remove('text-slate-400');
                } else {
                    btn.classList.remove('text-blue-500');
                    btn.classList.add('text-slate-400');
                }
            });

            // Render Content
            switch(sectionId) {
                case 'home': renderHome(); break;
                case 'store': renderStore(); break;
                case 'cs': renderCS(); break;
                case 'rules': renderRules(); break;
                case 'profile': renderProfile(); break;
            }
        }

        // CS SECTION
        function renderCS() {
            const container = document.getElementById('main-content');
            
            // Get all CS matches (user-created matches that are Active, Waiting, or Pending Approval)
            // Filter out "Pending Approval" matches for users who are not the creator or opponent
            const csMatches = db.tournaments.filter(t => {
                if (t.type !== 'CS') return false;

                const allowed = ['Waiting', 'Pending Approval', 'Active', 'Pending Review'];
                if (!allowed.includes(t.status)) return false;

                // If match has an opponent or is under review, only show to creator and opponent
                if (t.status === 'Pending Approval' || t.status === 'Active' || t.status === 'Pending Review') {
                    return t.userId === currentUser.id || t.opponentId === currentUser.id;
                }

                // Waiting matches are visible to everyone
                return true;
            });
            
            container.innerHTML = `
                <div class="fade-in">
                    <!-- Header with Add Match Button -->
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-white"><i class="fas fa-crosshairs text-blue-400 mr-2"></i>CS Matches</h2>
                        <button onclick="openCreateCSMatchModal()" class="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-1">
                            <i class="fas fa-plus"></i> Add Match
                        </button>
                    </div>
                    
                    <!-- CS Match Rules -->
                    <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 mb-4">
                        <h3 class="text-blue-400 font-bold text-sm mb-2"><i class="fas fa-info-circle mr-1"></i>CS Match Rules</h3>
                        <ul class="text-xs text-slate-300 space-y-1">
                            <li>• Winner receives <span class="text-green-400 font-bold">160%</span> of entry fee</li>
                            <li>• Winner must upload screenshot as proof</li>
                            <li>• Both players must select Win/Lose result</li>
                        </ul>
                    </div>
                    
                    <!-- Available Matches -->
                    <div class="mb-3 flex justify-between items-center">
                        <h3 class="text-sm font-bold text-slate-400"><i class="fas fa-gamepad text-blue-400 mr-1"></i>Available Matches</h3>
                        <span class="text-xs text-slate-500">${csMatches.length} active</span>
                    </div>
                    
                    ${csMatches.length > 0 ? `
                        <div class="space-y-3">
                            ${csMatches.map(match => {
                                const isOwner = match.userId === currentUser.id;
                                const creator = db.users.find(u => u.id === match.userId);
                                return `
                                <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition">
                                    <div class="flex justify-between items-start mb-2">
                                        <div class="flex items-center gap-2">
                                            <img src="${creator?.avatar || 'https://ui-avatars.com/api/?name=User'}" class="w-8 h-8 rounded-full">
                                            <div>
                                                <p class="font-bold text-white text-sm">${creator?.username || 'Unknown'}</p>
                                                <p class="text-[10px] text-slate-500">Room #${match.id.toString().slice(-4)}</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <span class="bg-${match.matchType === 'Lone Wolf' ? 'purple' : 'blue'}-500/20 text-${match.matchType === 'Lone Wolf' ? 'purple' : 'blue'}-400 text-[10px] px-2 py-0.5 rounded block mb-1">
                                                ${match.matchType || 'Clash Squad'}
                                            </span>
                                            <span class="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded">
                                                <i class="fas fa-circle text-[5px] mr-1 animate-pulse"></i>${match.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div class="grid grid-cols-3 gap-2 text-center text-xs my-3">
                                        <div class="bg-slate-900 p-2 rounded">
                                            <p class="text-slate-400">Entry</p>
                                            <p class="font-bold text-white">${match.fee} <i class="fas fa-gem text-blue-400 text-[10px]"></i></p>
                                        </div>
                                        <div class="bg-slate-900 p-2 rounded">
                                            <p class="text-slate-400">Prize</p>
                                            <p class="font-bold text-green-400">${Math.floor(match.fee * 1.6)}</p>
                                        </div>
                                        <div class="bg-slate-900 p-2 rounded">
                                            <p class="text-slate-400">Rounds</p>
                                            <p class="font-bold text-yellow-400">${match.rounds || 7}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="flex flex-wrap gap-1 text-[10px] mb-3">
                                        ${match.headshot ? '<span class="bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Headshot</span>' : ''}
                                        ${match.limitedAmmo ? '<span class="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Ltd Ammo</span>' : ''}
                                        ${match.skills ? '<span class="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Skills</span>' : ''}
                                        <span class="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Coins: ${match.coins || 1500}</span>
                                    </div>
                                    
                                    ${isOwner ? `
                                        ${match.status === 'Waiting' ? `
                                            <!-- Remove Match Button for Creator when no opponent -->
                                            <button onclick="removeCSMatch(${match.id})" class="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg text-xs font-bold transition mb-2">
                                                <i class="fas fa-trash-alt mr-1"></i> Remove Match
                                            </button>
                                        ` : ''}
                                        ${match.status === 'Pending Approval' ? `
                                            <!-- Opponent Info -->
                                            <div class="bg-yellow-500/10 border border-yellow-500/30 p-2 rounded mb-2">
                                                <p class="text-xs text-yellow-400 font-bold mb-1"><i class="fas fa-user-clock mr-1"></i>Join Request from:</p>
                                                <p class="text-white font-bold">${match.opponentUsername || 'Unknown'}</p>
                                            </div>
                                            <div class="flex gap-2">
                                                <button onclick="acceptCSMatch(${match.id})" class="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-xs font-bold transition">
                                                    <i class="fas fa-check mr-1"></i> Accept
                                                </button>
                                                <button onclick="rejectCSMatch(${match.id})" class="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-xs font-bold transition">
                                                    <i class="fas fa-times mr-1"></i> Reject
                                                </button>
                                            </div>
                                        ` : match.status === 'Active' ? `
                                            <!-- Room Credentials Section for Creator -->
                                            <div class="bg-slate-800 p-3 rounded mb-2 border border-slate-700">
                                                <p class="text-xs text-slate-400 mb-2"><i class="fas fa-key mr-1"></i>Room Credentials:</p>
                                                <div class="grid grid-cols-2 gap-2 mb-2">
                                                    <div>
                                                        <label class="text-[10px] text-slate-500">Match ID</label>
                                                        <input type="text" id="cs-id-${match.id}" value="${match.roomId || ''}" placeholder="Enter ID" class="w-full bg-slate-900 p-1.5 rounded border border-slate-600 text-white text-xs">
                                                    </div>
                                                    <div>
                                                        <label class="text-[10px] text-slate-500">Password</label>
                                                        <input type="text" id="cs-pass-${match.id}" value="${match.roomPassword || ''}" placeholder="Enter Pass" class="w-full bg-slate-900 p-1.5 rounded border border-slate-600 text-white text-xs">
                                                    </div>
                                                </div>
                                                <button onclick="saveCSCredentials(${match.id})" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-bold transition mb-2">
                                                    <i class="fas fa-save mr-1"></i> Save Details
                                                </button>
                                                <button onclick="sendCSCredentialsToOpponent(${match.id})" class="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold transition mb-2">
                                                    <i class="fas fa-paper-plane mr-1"></i> Send to Opponent
                                                </button>
                                            </div>
                                            
                                            ${match.credentialsSent ? `
                                            <div class="bg-green-500/10 border border-green-500/30 p-2 rounded text-center text-xs text-green-400 font-bold mb-2">
                                                <i class="fas fa-check-circle mr-1"></i> Credentials Sent to ${match.opponentUsername || 'Opponent'}
                                            </div>
                                            ` : ''}
                                            
                                            <!-- Win/Lose Buttons for Creator -->
                                            ${match.creatorReported ? `
                                                <div class="bg-green-500/20 border border-green-500/30 p-2 rounded text-center text-xs text-green-400 font-bold">
                                                    <i class="fas fa-check-circle mr-1"></i> Result Reported
                                                </div>
                                            ` : `
                                                <div class="flex gap-2">
                                                    <button onclick="reportCSResult(${match.id}, true, true)" class="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-xs font-bold transition">
                                                        <i class="fas fa-trophy mr-1"></i> Won
                                                    </button>
                                                    <button onclick="reportCSResult(${match.id}, false, true)" class="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-xs font-bold transition">
                                                        <i class="fas fa-times mr-1"></i> Lost
                                                    </button>
                                                </div>
                                            `}
                                        ` : `
                                            <!-- Status shows completed or cancelled -->
                                            <div class="bg-slate-700 py-2 rounded-lg text-xs font-bold text-center text-slate-300">
                                                ${match.status}
                                            </div>
                                        `}
                                    ` : `
                                        ${match.status === 'Pending Approval' ? `
                                            <div class="bg-yellow-500/20 py-2 rounded-lg text-xs font-bold text-center text-yellow-400">
                                                <i class="fas fa-hourglass-half mr-1"></i> Pending Approval
                                            </div>
                                        ` : match.status === 'Active' ? `
                                            ${match.credentialsSent ? `
                                            <button onclick="viewCSCredentials(${match.id})" class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-xs font-bold transition mb-2">
                                                <i class="fas fa-key mr-1"></i> View ID/Password
                                            </button>
                                            ` : `
                                            <div class="bg-yellow-500/20 py-2 rounded-lg text-xs font-bold text-center text-yellow-400 mb-2">
                                                <i class="fas fa-hourglass-half mr-1"></i> Waiting for Credentials
                                            </div>
                                            `}
                                            
                                            <!-- Win/Lose Buttons for Opponent -->
                                            ${match.opponentReported ? `
                                                <div class="bg-green-500/20 border border-green-500/30 p-2 rounded text-center text-xs text-green-400 font-bold">
                                                    <i class="fas fa-check-circle mr-1"></i> Result Reported
                                                </div>
                                            ` : `
                                                <div class="flex gap-2">
                                                    <button onclick="reportCSResult(${match.id}, true, false)" class="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-xs font-bold transition">
                                                        <i class="fas fa-trophy mr-1"></i> Won
                                                    </button>
                                                    <button onclick="reportCSResult(${match.id}, false, false)" class="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-xs font-bold transition">
                                                        <i class="fas fa-times mr-1"></i> Lost
                                                    </button>
                                                </div>
                                            `}
                                        ` : match.status === 'Pending Review' ? `
                                            <div class="bg-purple-500/20 border border-purple-500/30 py-2 rounded-lg text-xs font-bold text-center text-purple-300">
                                                <i class="fas fa-user-shield mr-1"></i> Pending Review
                                            </div>
                                        ` : `
                                            <button onclick="joinCSMatch(${match.id})" class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-xs font-bold transition">
                                                <i class="fas fa-sign-in-alt mr-1"></i> Join Match (${match.fee} stones)
                                            </button>
                                        `}
                                    `}
                                </div>
                            `}).join('')}
                        </div>
                    ` : `
                        <div class="bg-slate-800/50 p-8 rounded-xl border border-slate-700 text-center">
                            <i class="fas fa-crosshairs text-4xl text-slate-600 mb-3"></i>
                            <h4 class="font-bold text-lg text-slate-400 mb-1">No Active Matches</h4>
                            <p class="text-xs text-slate-500 mb-4">Be the first to create a CS match!</p>
                            <button onclick="openCreateCSMatchModal()" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-bold transition">
                                <i class="fas fa-plus mr-1"></i> Create Match
                            </button>
                        </div>
                    `}
                    
                    <!-- My CS History -->
                    <div class="mt-6">
                        <h3 class="text-sm font-bold text-slate-400 mb-2"><i class="fas fa-history mr-1"></i>My CS History</h3>
                        <div class="bg-slate-800 rounded-lg border border-slate-700 p-3 max-h-40 overflow-y-auto">
                            ${db.tournaments.filter(t => t.type === 'CS' && (t.userId === currentUser.id || t.opponentId === currentUser.id)).slice(-5).reverse().map(match => `
                                <div class="flex justify-between items-center text-xs border-b border-slate-700 py-2 last:border-0">
                                    <span class="text-slate-300">Room #${match.id.toString().slice(-4)}</span>
                                    <span class="text-slate-400">${match.fee} stones</span>
                                    <span class="${match.status === 'Completed' ? 'text-green-400' : match.status === 'Cancelled' ? 'text-red-400' : 'text-yellow-400'}">${match.status}</span>
                                </div>
                            `).join('') || '<p class="text-slate-500 text-xs text-center py-2">No history yet</p>'}
                        </div>
                    </div>
                </div>
            `;
        }

        // --- SECTIONS RENDER LOGIC ---

        // 1. HOME
        function renderHome() {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const isSaturday = today === 'Saturday';
            
            // Get admin-created BR tournaments
            const allAdminBRTournaments = db.tournaments.filter(t => t.createdBy === 'Admin' && t.status === 'Upcoming');
            
            // Filter tournaments: hide full rooms from users who haven't joined
            const adminBRTournaments = allAdminBRTournaments.filter(tournament => {
                // Count how many players have joined this tournament
                const joinedCount = db.tournaments.filter(t => t.parentTournamentId === tournament.id).length;
                const maxPlayers = tournament.maxPlayers || 48;
                
                // Check if current user has joined this tournament
                const userHasJoined = db.tournaments.some(t => 
                    t.parentTournamentId === tournament.id && t.userId === currentUser.id
                );
                
                // If room is full and user hasn't joined, hide it
                if (joinedCount >= maxPlayers && !userHasJoined) {
                    return false;
                }
                
                // Show the tournament
                return true;
            });

            const container = document.getElementById('main-content');
            container.innerHTML = `
                <div class="fade-in space-y-6">
                    <!-- Banner -->
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 shadow-lg text-white relative overflow-hidden">
                        <div class="relative z-10">
                            <h2 class="text-2xl font-bold mb-1">Welcome, ${currentUser.username}</h2>
                            <p class="text-sm opacity-90 mb-3">Join tournaments and win big!</p>
                        </div>
                        <i class="fas fa-trophy absolute -right-4 -bottom-4 text-8xl opacity-20 rotate-12"></i>
                    </div>

                    ${isSaturday ? `
                    <div class="bg-yellow-600/20 border border-yellow-500/50 rounded-xl p-4 flex items-center gap-3">
                        <i class="fas fa-star text-yellow-400 text-2xl"></i>
                        <div>
                            <h3 class="font-bold text-yellow-400">Saturday Special</h3>
                            <p class="text-xs text-slate-300">Free Tournament Entry Today!</p>
                        </div>
                    </div>` : ''}

                    <!-- Featured BR Tournaments -->
                    <div>
                        <div class="flex justify-between items-end mb-3">
                            <h3 class="text-lg font-bold text-slate-200"><i class="fas fa-fire text-orange-500 mr-2"></i>Today's BR Tournaments</h3>
                            <span class="text-xs text-blue-400 cursor-pointer" onclick="showSection('game'); switchGameTab('BR')">View All</span>
                        </div>
                        
                        ${adminBRTournaments.length > 0 ? `
                            <div class="space-y-3">
                                ${adminBRTournaments.map(tournament => {
                                    // Check if current user has already joined this tournament
                                    const userJoined = db.tournaments.find(t => 
                                        t.parentTournamentId === tournament.id && t.userId === currentUser.id
                                    );
                                    
                                    return `
                                    <div class="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-md hover:border-orange-500/50 transition">
                                        <div class="flex justify-between mb-3">
                                            <span class="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded border border-green-500/30">
                                                <i class="fas fa-circle text-[6px] mr-1 animate-pulse"></i>${tournament.status}
                                            </span>
                                            <span class="text-xs text-slate-400"><i class="fas fa-clock mr-1"></i>${tournament.time}</span>
                                        </div>
                                        <h4 class="font-bold text-lg mb-1 text-orange-400">${tournament.type}</h4>
                                        <p class="text-xs text-slate-500 mb-2">Room ID: #${tournament.id.toString().slice(-4)}</p>
                                        
                                        <div class="grid grid-cols-3 gap-2 text-center text-xs my-3">
                                            <div class="bg-slate-900 p-2 rounded border border-slate-700">
                                                <p class="text-slate-400">Entry</p>
                                                <p class="font-bold text-white">${tournament.fee} <i class="fas fa-gem text-blue-400 text-[10px]"></i></p>
                                            </div>
                                            <div class="bg-slate-900 p-2 rounded border border-slate-700">
                                                <p class="text-slate-400">${tournament.type === 'BR Per Kill' ? 'Per Kill' : 'Survival'}</p>
                                                <p class="font-bold text-green-400">${tournament.type === 'BR Per Kill' ? (tournament.killBonus || '-') : (tournament.survivalBonus || '-')}</p>
                                            </div>
                                            <div class="bg-slate-900 p-2 rounded border border-slate-700">
                                                <p class="text-slate-400">Booyah</p>
                                                <p class="font-bold text-yellow-400">${tournament.booyahBonus}</p>
                                            </div>
                                        </div>
                                        
                                        ${userJoined ? `
                                            <button onclick="viewTournamentCredentials(${tournament.id})" class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm font-bold transition">
                                                <i class="fas fa-key mr-1"></i> View ID/Password
                                            </button>
                                        ` : `
                                            <button onclick="joinBRTournament(${tournament.id})" class="w-full bg-orange-600 hover:bg-orange-700 py-2 rounded-lg text-sm font-bold transition">
                                                <i class="fas fa-sign-in-alt mr-1"></i> Join Now
                                            </button>
                                        `}
                                    </div>
                                `}).join('')}
                            </div>
                        ` : `
                            <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-md text-center">
                                <i class="fas fa-calendar-times text-4xl text-slate-600 mb-3"></i>
                                <h4 class="font-bold text-lg mb-1 text-slate-400">No Tournaments Available</h4>
                                <p class="text-xs text-slate-500 mb-4">Check back later for upcoming BR tournaments!</p>
                                <button onclick="showSection('game')" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold transition">
                                    <i class="fas fa-gamepad mr-1"></i> Play Other Modes
                                </button>
                            </div>
                        `}
                    </div>
                    
                    <!-- Quick Stats -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                            <p class="text-xs text-slate-400">Your Balance</p>
                            <p class="text-xl font-bold text-yellow-400">${currentUser.stones} <i class="fas fa-gem text-blue-400 text-sm"></i></p>
                        </div>
                        <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                            <p class="text-xs text-slate-400">Active Tournaments</p>
                            <p class="text-xl font-bold text-green-400">${adminBRTournaments.length}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Join BR Tournament function
        function joinBRTournament(tournamentId) {
            const tournament = db.tournaments.find(t => t.id === tournamentId);
            if (!tournament) return alert("Tournament not found!");
            
            if (currentUser.stones < tournament.fee) {
                alert(`Insufficient Stones! You need ${tournament.fee} stones to join.`);
                openAddMoneyModal();
                return;
            }
            
            // Check if user already joined
            const alreadyJoined = db.tournaments.find(t => 
                t.parentTournamentId === tournamentId && t.userId === currentUser.id
            );
            if (alreadyJoined) {
                return alert("You have already joined this tournament!");
            }
            
            if (confirm(`Join ${tournament.type} for ${tournament.fee} stones?\n\nTime: ${tournament.time}\nPer Kill: ${tournament.killBonus}\nBooyah: ${tournament.booyahBonus}`)) {
                updateStones(-tournament.fee);
                
                // Create user's tournament entry
                const userEntry = {
                    id: Date.now(),
                    parentTournamentId: tournamentId,
                    type: tournament.type,
                    userId: currentUser.id,
                    username: currentUser.username,
                    status: 'Joined',
                    fee: tournament.fee,
                    date: new Date().toISOString(),
                    roomPassword: tournament.password
                };
                
                db.tournaments.push(userEntry);
                saveDB();
                
                alert(`✅ Joined Successfully!\n\n📍 ${tournament.type}\n🕐 Time: ${tournament.time}\n🔑 Room Password: ${tournament.password}\n\nGo to Profile > Game History to see details.`);
                renderHome();
            }
        }
        
        // View Tournament Credentials
        function viewTournamentCredentials(tournamentId) {
            const tournament = db.tournaments.find(t => t.id === tournamentId);
            if (!tournament) return alert("Tournament not found!");
            
            // Calculate view time (10 mins before match time)
            let viewTimeDisplay = "10 mins before start";
            if (tournament.time) {
                try {
                    const [hours, mins] = tournament.time.split(':').map(Number);
                    const date = new Date();
                    date.setHours(hours);
                    date.setMinutes(mins - 10);
                    viewTimeDisplay = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                } catch (e) {
                    console.error("Time parse error", e);
                }
            }
            
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            const hasCredentials = tournament.matchId || tournament.password;
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-key mr-2 text-blue-400"></i>Room Credentials</h3>
                
                <div class="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-4">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-orange-400 font-bold">${tournament.type}</span>
                        <span class="text-xs text-slate-400">Room #${tournament.id.toString().slice(-4)}</span>
                    </div>
                    <div class="text-xs text-slate-400 mb-3">
                        <p><i class="fas fa-clock mr-1"></i> Time: ${tournament.time}</p>
                        <p><i class="fas fa-gem text-blue-400 mr-1"></i> Entry: ${tournament.fee} stones</p>
                    </div>
                </div>
                
                ${hasCredentials ? `
                    <div class="bg-green-500/10 border border-green-500/50 p-4 rounded-lg mb-4">
                        <h4 class="text-green-400 font-bold mb-3 text-center"><i class="fas fa-check-circle mr-1"></i> Room Details</h4>
                        
                        <div class="space-y-3">
                            <div class="bg-slate-900 p-3 rounded-lg">
                                <p class="text-xs text-slate-400 mb-1">Match ID</p>
                                <p class="text-xl font-bold text-white text-center">${tournament.matchId || 'Not set yet'}</p>
                            </div>
                            
                            <div class="bg-slate-900 p-3 rounded-lg">
                                <p class="text-xs text-slate-400 mb-1">Password</p>
                                <p class="text-xl font-bold text-yellow-400 text-center">${tournament.password || 'Not set yet'}</p>
                            </div>
                        </div>
                        
                        <p class="text-xs text-slate-400 text-center mt-3"><i class="fas fa-info-circle mr-1"></i>Use these credentials to join the room in Free Fire</p>
                    </div>
                ` : `
                    <div class="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-lg mb-4 text-center">
                        <i class="fas fa-hourglass-half text-4xl text-yellow-400 mb-3"></i>
                        <h4 class="text-yellow-400 font-bold mb-2">Credentials Not Available Yet</h4>
                        <p class="text-xs text-slate-400 mb-3">The admin hasn't set the room ID and password yet. Please check back later or wait for the match time.</p>
                        <div class="bg-slate-800 p-2 rounded text-xs text-slate-300">
                            <i class="fas fa-clock mr-1"></i>ID/Password view time: <span class="text-blue-400 font-bold">${viewTimeDisplay}</span>
                        </div>
                    </div>
                `}
                
                <button onclick="closeModal()" class="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-lg font-bold transition">
                    <i class="fas fa-times mr-1"></i> Close
                </button>
            `;
        }

        function joinTournamentMock(type) {
            if(currentUser.stones < 50) {
                alert("Insufficient Stones! Please Top-up.");
                openAddMoneyModal();
            } else {
                const confirmed = confirm(`Join ${type} Tournament for 50 stones?`);
                if(confirmed) {
                    updateStones(-50);
                    alert("Joined successfully! Room ID/Password will be sent to your Profile history.");
                    db.tournaments.push({
                        id: Date.now(),
                        type: type,
                        userId: currentUser.id,
                        status: 'Upcoming',
                        fee: 50,
                        date: new Date().toISOString()
                    });
                    saveDB();
                }
            }
        }

        // 2. STORE
        function renderStore() {
            const container = document.getElementById('main-content');

            // Initialize store items if missing
            if (!db.storeItems) {
                db.storeItems = {
                    diamonds: [
                        { id: 1, name: '25 Diamonds', diamonds: 25, price: 30 },
                        { id: 2, name: '50 Diamonds', diamonds: 50, price: 55 },
                        { id: 3, name: '115 Diamonds', diamonds: 115, price: 100 },
                        { id: 4, name: '240 Diamonds', diamonds: 240, price: 200 },
                        { id: 5, name: '610 Diamonds', diamonds: 610, price: 500 },
                        { id: 6, name: '1240 Diamonds', diamonds: 1240, price: 1000 },
                        { id: 7, name: '2530 Diamonds', diamonds: 2530, price: 2000 }
                    ],
                    others: [
                        { id: 101, name: 'Weekly Mem.', price: 200 },
                        { id: 102, name: 'Level-up Pass', price: 200 },
                        { id: 103, name: 'Monthly Mem.', price: 1030 },
                        { id: 104, name: 'Evo (3 Days)', price: 110 },
                        { id: 105, name: 'Evo (7 Days)', price: 210 },
                        { id: 106, name: 'Evo (30 Days)', price: 420 }
                    ]
                };
                saveDB();
            }

            // Normalize legacy keys if any (d/s or missing fields)
            const diamonds = (db.storeItems.diamonds || []).map(item => {
                const d = item.diamonds ?? item.d;
                const p = item.price ?? item.s;
                return {
                    id: item.id || (Date.now() + Math.floor(Math.random() * 100000)),
                    name: item.name || (d ? `${d} Diamonds` : 'Diamonds'),
                    diamonds: Number(d),
                    price: Number(p)
                };
            }).filter(i => Number.isFinite(i.diamonds) && i.diamonds > 0 && Number.isFinite(i.price) && i.price > 0).sort((a,b) => a.diamonds - b.diamonds);

            const others = (db.storeItems.others || []).map(item => {
                const p = item.price ?? item.s;
                return {
                    id: item.id || (Date.now() + Math.floor(Math.random() * 100000)),
                    name: item.name || item.item || 'Item',
                    price: Number(p)
                };
            }).filter(i => i.name && Number.isFinite(i.price) && i.price > 0);

            // Persist normalized structure
            db.storeItems.diamonds = diamonds;
            db.storeItems.others = others;
            saveDB();

            container.innerHTML = `
                <div class="fade-in">
                    <div class="flex items-end justify-between mb-4">
                        <h2 class="text-2xl font-bold">Store <span class="text-sm font-normal text-slate-400">(Auto-Email to Admin)</span></h2>
                        <button onclick="renderStore()" class="text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg transition">
                            <i class="fas fa-rotate-right mr-1"></i> Refresh
                        </button>
                    </div>

                    <h3 class="text-blue-400 font-bold mb-2 uppercase text-sm tracking-wider">💎 Diamonds Top-up</h3>
                    ${diamonds.length ? `
                        <div class="grid grid-cols-2 gap-3 mb-6">
                            ${diamonds.map(item => `
                                <div onclick='openBuyItemModal(${JSON.stringify(item.name)}, ${item.price})' class="bg-slate-800 border border-slate-700 p-3 rounded-xl flex flex-col items-center hover:border-blue-500 transition cursor-pointer relative overflow-hidden group">
                                    <div class="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition"></div>
                                    <span class="text-xl font-bold text-white mb-1">${escapeHtml(item.diamonds)} 💎</span>
                                    <span class="text-yellow-400 font-bold text-sm">${escapeHtml(item.price)} Stones</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700 text-center mb-6">
                            <p class="text-slate-400 text-sm">No diamond products available.</p>
                        </div>
                    `}

                    <h3 class="text-purple-400 font-bold mb-2 uppercase text-sm tracking-wider">⭐ Special Items</h3>
                    ${others.length ? `
                        <div class="grid grid-cols-2 gap-3">
                            ${others.map(item => `
                                <div onclick='openBuyItemModal(${JSON.stringify(item.name)}, ${item.price})' class="bg-slate-800 border border-slate-700 p-3 rounded-xl flex flex-col items-center hover:border-purple-500 transition cursor-pointer relative overflow-hidden group">
                                    <div class="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition"></div>
                                    <span class="text-sm font-bold text-white mb-1 text-center">${escapeHtml(item.name)}</span>
                                    <span class="text-yellow-400 font-bold text-sm">${escapeHtml(item.price)} Stones</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700 text-center">
                            <p class="text-slate-400 text-sm">No special products available.</p>
                        </div>
                    `}
                </div>
            `;
        }

        function openBuyItemModal(itemName, price) {
            document.getElementById('modal-overlay').classList.remove('hidden');
            const uidValue = currentUser.ffUID || '';
            document.getElementById('modal-body').innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center">Buy ${escapeHtml(itemName)}</h3>
                <p class="text-slate-300 text-sm text-center mb-4">${price} stones</p>
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Free Fire UID</label>
                    <input type="text" id="store-buy-uid" value="${uidValue}" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none" placeholder="Enter your FF UID (8-12 digits)">
                    <p class="text-xs text-slate-500 mt-1">UID will be used for delivery</p>
                </div>
                <button onclick="submitStoreOrder('${escapeHtml(itemName)}', ${price})" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg mt-4 transition">
                    Submit Order
                </button>
                <button onclick="closeModal()" class="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg mt-2 text-sm transition">
                    Cancel
                </button>
            `;
        }

        function submitStoreOrder(itemName, price) {
            const uidInput = document.getElementById('store-buy-uid');
            const uid = uidInput.value.trim();
            
            if (!uid) {
                alert('Please enter your Free Fire UID.');
                return;
            }
            if (!/^\d{8,12}$/.test(uid)) {
                alert('UID must be 8-12 digits only.');
                uidInput.focus();
                return;
            }
            
            if (currentUser.stones < price) {
                alert(`Not enough stones! You need ${price - currentUser.stones} more stones.`);
                openAddMoneyModal();
                closeModal();
                return;
            }
            
            if (confirm(`Confirm order:\n\nItem: ${itemName}\nPrice: ${price} stones\nUID: ${uid}\n\nSubmit to admin?`)) {
                updateStones(-price);
                
                const order = {
                    id: Date.now(),
                    userId: currentUser.id,
                    username: currentUser.username,
                    uid: uid,
                    item: itemName,
                    price: price,
                    date: new Date().toISOString(),
                    status: 'Pending'
                };
                db.orders.push(order);
                saveDB();
                
                alert(`✅ Order submitted successfully!\n\nItem: ${itemName}\nUID: ${uid}\n\nAdmin will deliver to this account soon.`);
                closeModal();
                // Optionally update user's ffUID
                if (!currentUser.ffUID) {
                    updateUserUID(uid);
                }
            }
        }

        // 3. GAME
        let gameTab = 'CS';
        function renderGame() {
            const container = document.getElementById('main-content');
            
            container.innerHTML = `
                <div class="fade-in h-full flex flex-col">
                    <!-- Tabs -->
                    <div class="flex border-b border-slate-700 mb-4">
                        <button onclick="switchGameTab('CS')" class="flex-1 pb-2 text-center font-bold text-sm ${gameTab === 'CS' ? 'tab-active' : 'text-slate-400'}">CS Match</button>
                        <button onclick="switchGameTab('LW')" class="flex-1 pb-2 text-center font-bold text-sm ${gameTab === 'LW' ? 'tab-active' : 'text-slate-400'}">Lone Wolf</button>
                        <button onclick="switchGameTab('BR')" class="flex-1 pb-2 text-center font-bold text-sm ${gameTab === 'BR' ? 'tab-active' : 'text-slate-400'}">BR Rank</button>
                    </div>

                    <div id="game-content" class="flex-1 overflow-y-auto">
                        ${getGameContent(gameTab)}
                    </div>
                </div>
            `;
        }

        function switchGameTab(tab) {
            gameTab = tab;
            renderGame();
        }

        function getGameContent(type) {
            if (type === 'CS' || type === 'LW') {
                const isCS = type === 'CS';
                return `
                    <div class="space-y-4">
                        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h3 class="font-bold text-lg mb-3 text-blue-400">Create ${type} Challenge</h3>
                            
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="text-xs text-slate-400">Entry Fee</label>
                                    <input type="number" id="match-fee" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm" placeholder="Stones">
                                </div>
                                <div>
                                    <label class="text-xs text-slate-400">Time</label>
                                    <input type="time" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm">
                                </div>
                            </div>

                            <div class="space-y-2 mb-4">
                                <p class="text-xs font-bold text-slate-300">Match Settings:</p>
                                <div class="flex flex-wrap gap-2">
                                    ${isCS ? `
                                    <select class="bg-slate-900 text-xs p-1 rounded border border-slate-700"><option>Rounds: 7</option><option>11</option><option>13</option></select>
                                    <select class="bg-slate-900 text-xs p-1 rounded border border-slate-700"><option>Coins: 1500</option><option>500</option><option>9950</option></select>
                                    ` : `
                                    <select class="bg-slate-900 text-xs p-1 rounded border border-slate-700"><option>Rounds: 9</option><option>11</option></select>
                                    `}
                                    <label class="flex items-center gap-1 text-xs"><input type="checkbox" checked> Headshot Only</label>
                                    <label class="flex items-center gap-1 text-xs"><input type="checkbox" checked> Ltd Ammo</label>
                                    <label class="flex items-center gap-1 text-xs"><input type="checkbox"> Skills</label>
                                </div>
                            </div>

                            <div class="bg-blue-900/30 p-3 rounded text-xs mb-4">
                                <p class="flex justify-between"><span>Entry Fee:</span> <span id="preview-fee">0</span></p>
                                <p class="flex justify-between font-bold text-green-400 mt-1"><span>Winning Prize (160%):</span> <span id="preview-win">0</span></p>
                            </div>

                            <button onclick="createMatch('${type}')" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-bold transition">Create Room</button>
                        </div>

                        <div class="text-center text-slate-500 text-xs mt-4">
                            <p>Winner must upload screenshot in Profile > Game History</p>
                        </div>
                    </div>
                `;
            } else {
                // BR Content - Show admin-created tournaments
                const adminBRTournaments = db.tournaments.filter(t => t.createdBy === 'Admin' && t.status === 'Upcoming');
                
                return `
                    <div class="space-y-4">
                        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h3 class="font-bold text-lg mb-2 text-orange-400">Battle Royale Rules</h3>
                            <ul class="text-xs text-slate-300 space-y-1 mb-4">
                                <li>• <strong>Per Kill:</strong> 40% of Entry Fee per Kill</li>
                                <li>• <strong>Booyah Bonus:</strong> 9% of Total Pot</li>
                                <li>• <strong>Survival Mode:</strong> Top 40% get 200% Refund</li>
                                <li>• <strong>1st Place:</strong> 250% (Survival Mode)</li>
                            </ul>
                        </div>

                        <div class="flex justify-between items-center">
                            <h4 class="font-bold text-sm text-slate-400"><i class="fas fa-fire text-orange-500 mr-1"></i> Available Rooms</h4>
                            <span class="text-xs text-slate-500">${adminBRTournaments.length} active</span>
                        </div>
                        
                        ${adminBRTournaments.length > 0 ? `
                            <div class="space-y-3">
                                ${adminBRTournaments.map(tournament => `
                                    <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-orange-500/50 transition">
                                        <div class="flex justify-between items-start mb-2">
                                            <div>
                                                <p class="font-bold text-orange-400">${tournament.type}</p>
                                                <p class="text-xs text-slate-500">Room #${tournament.id.toString().slice(-4)}</p>
                                            </div>
                                            <span class="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded">
                                                <i class="fas fa-circle text-[5px] mr-1 animate-pulse"></i>${tournament.status}
                                            </span>
                                        </div>
                                        <div class="flex justify-between items-center text-xs mb-3">
                                            <span class="text-slate-400"><i class="fas fa-gem text-blue-400 mr-1"></i>${tournament.fee} Stones</span>
                                            <span class="text-slate-400"><i class="fas fa-clock mr-1"></i>${tournament.time}</span>
                                        </div>
                                        <div class="flex gap-2 text-[10px] mb-3">
                                            <span class="bg-slate-900 px-2 py-1 rounded">Kill: ${tournament.killBonus}</span>
                                            <span class="bg-slate-900 px-2 py-1 rounded">Booyah: ${tournament.booyahBonus}</span>
                                        </div>
                                        <button onclick="joinBRTournament(${tournament.id})" class="w-full bg-orange-600 hover:bg-orange-700 py-2 rounded text-xs font-bold transition">
                                            <i class="fas fa-sign-in-alt mr-1"></i> Join Tournament
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
                                <i class="fas fa-calendar-times text-3xl text-slate-600 mb-2"></i>
                                <p class="text-slate-400 text-sm">No BR tournaments available</p>
                                <p class="text-slate-500 text-xs mt-1">Check back later or contact admin</p>
                            </div>
                        `}
                    </div>
                `;
            }
        }

        function createMatch(type) {
            const feeInput = document.getElementById('match-fee').value;
            const fee = parseInt(feeInput);
            
            if(!fee || fee <= 0) return alert("Invalid Fee");
            if(currentUser.stones < fee) {
                alert("Insufficient Stones");
                openAddMoneyModal();
                return;
            }

            if(confirm(`Create ${type} Match for ${fee} stones?`)) {
                updateStones(-fee);
                alert("Match Created! Wait for opponent or share Room ID.");
                db.tournaments.push({
                    id: Date.now(),
                    type: type,
                    userId: currentUser.id,
                    status: 'Active',
                    fee: fee,
                    date: new Date().toISOString()
                });
                saveDB();
            }
        }

        // 4. RULES
        function renderRules() {
            const rules = getRulesConfig();

            document.getElementById('main-content').innerHTML = `
                <div class="fade-in space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-bold text-white">App Rules</h2>
                        <button onclick="showSection('home')" class="text-xs text-slate-400 hover:text-white transition">
                            <i class="fas fa-arrow-left mr-1"></i>Back
                        </button>
                    </div>

                    <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h3 class="text-red-400 font-bold mb-2"><i class="fas fa-gavel mr-2"></i>General Rules</h3>
                        <ul class="list-disc list-inside text-sm text-slate-300 space-y-1">
                            ${rules.general.map(r => `<li>${escapeHtml(r)}</li>`).join('') || '<li>No rules set.</li>'}
                        </ul>
                    </div>

                    <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h3 class="text-blue-400 font-bold mb-2"><i class="fas fa-flag mr-2"></i>Reporting</h3>
                        <ul class="list-disc list-inside text-sm text-slate-300 space-y-1">
                            ${rules.reporting.map(r => `<li>${escapeHtml(r)}</li>`).join('') || '<li>No rules set.</li>'}
                        </ul>
                    </div>

                </div>
            `;
        }

        // 5. PROFILE
        function renderProfile() {
            const container = document.getElementById('main-content');
            
            const isAdmin = currentUser.role === 'admin';

            container.innerHTML = `
                <div class="fade-in space-y-5">
                    <!-- Header -->
                    <div class="flex items-center gap-4">
                        <div class="w-20 h-20 rounded-full bg-blue-600 overflow-hidden border-2 border-blue-400">
                            <img src="${currentUser.avatar}" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <input type="text" value="${currentUser.username}" id="profile-name-input" class="bg-transparent text-xl font-bold text-white w-full border-b border-transparent focus:border-blue-500 outline-none" onblur="updateUsername(this.value)">
                                <i class="fas fa-pen text-xs text-slate-500"></i>
                            </div>
                            <div class="flex items-center gap-2 text-slate-400 text-sm">
                                <span>UID:</span>
                                <input type="number" id="profile-uid-input" value="${currentUser.ffUID || currentUser.id}" class="bg-transparent border-b border-transparent focus:border-blue-500 outline-none w-28 text-slate-200 text-sm" onblur="updateUserUID(this.value)">
                            </div>
                            <p class="text-yellow-400 font-bold text-lg">${currentUser.stones} Stones</p>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="openAddMoneyModal()" class="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-sm">
                            <i class="fas fa-plus-circle mr-1"></i> Add Stones
                        </button>
                        <button onclick="openRedeemModal()" class="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold text-sm">
                            <i class="fas fa-exchange-alt mr-1"></i> Redeem
                        </button>
                    </div>

                    <!-- Support -->
                    <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <h4 class="font-bold text-sm text-slate-400 mb-3 uppercase">Customer Care</h4>
                        <div class="flex gap-4">
                            <a href="https://t.me/SpecialTp1" target="_blank" class="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded text-center text-sm hover:bg-blue-500/30 transition"><i class="fab fa-telegram mr-2"></i>Telegram</a>
                            <a href="https://www.facebook.com/share/15y3BPna9e/" target="_blank" class="flex-1 bg-blue-700/20 text-blue-400 py-2 rounded text-center text-sm hover:bg-blue-700/30 transition"><i class="fab fa-facebook mr-2"></i>Facebook</a>
                        </div>
                    </div>

                    <!-- Lists -->
                    <div class="space-y-2">
                        <button onclick="toggleHistory('history-games')" class="w-full flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <span class="font-bold">🎮 Game History</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div id="history-games" class="hidden p-2 bg-slate-900 rounded border border-slate-700 text-sm text-slate-400">
                            ${db.tournaments.filter(t => t.userId === currentUser.id).map(t => `
                                <div class="flex justify-between border-b border-slate-800 py-2">
                                    <span>${t.type}</span>
                                    <span class="${t.status === 'Active' ? 'text-green-400' : 'text-slate-500'}">${t.status}</span>
                                </div>
                            `).join('') || '<p>No games played yet.</p>'}
                        </div>

                        <button onclick="toggleHistory('history-orders')" class="w-full flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <span class="font-bold">🛒 Store Orders</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                         <div id="history-orders" class="hidden p-2 bg-slate-900 rounded border border-slate-700 text-sm text-slate-400">
                            ${db.orders.filter(o => o.userId === currentUser.id).map(o => `
                                <div class="flex justify-between items-center border-b border-slate-800 py-2">
                                    <div class="flex flex-col">
                                        <span>${o.item}${o.uid ? ` (UID: ${o.uid.slice(-4)})` : ''}</span>
                                        <span class="text-[11px] text-slate-500">${new Date(o.date).toLocaleDateString()}</span>
                                    </div>
                                    <span class="text-xs font-semibold ${o.status === 'Completed' ? 'text-green-400' : o.status === 'Rejected' ? 'text-red-400' : 'text-yellow-400'}">
                                        ${o.status || 'Pending'}
                                    </span>
                                </div>
                            `).join('') || '<p>No orders yet.</p>'}
                        </div>
                    </div>
                    
                    <button onclick="location.reload()" class="w-full border border-red-500 text-red-500 py-2 rounded-lg mt-4 hover:bg-red-500 hover:text-white transition">Logout</button>
                    
                    ${isAdmin ? `
                    <div class="mt-6 pt-6 border-t border-slate-700">
                        <h3 class="text-red-500 font-bold mb-3"><i class="fas fa-shield-alt mr-2"></i>Admin Panel</h3>
                        
                        <!-- Pending Payment Requests Count -->
                        ${db.paymentRequests.filter(p => p.status === 'Pending').length > 0 ? `
                        <div class="bg-yellow-500/20 border border-yellow-500 p-2 rounded mb-3 flex items-center justify-between">
                            <span class="text-yellow-400 text-sm font-bold"><i class="fas fa-exclamation-circle mr-1"></i> ${db.paymentRequests.filter(p => p.status === 'Pending').length} Pending Payments</span>
                            <button onclick="openPaymentRequestsModal()" class="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">Review</button>
                        </div>
                        ` : ''}
                        
                        <div class="grid grid-cols-2 gap-2">
                             <button onclick="openManageUsersModal()" class="bg-slate-700 hover:bg-slate-600 p-2 rounded text-xs transition">
                                 <i class="fas fa-users mr-1"></i> Manage Users
                             </button>
                             <button onclick="openPaymentRequestsModal()" class="bg-green-600 hover:bg-green-700 p-2 rounded text-xs transition relative">
                                 <i class="fas fa-credit-card mr-1"></i> Payment Requests
                                 ${db.paymentRequests.filter(p => p.status === 'Pending').length > 0 ? `<span class=\"absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center\">${db.paymentRequests.filter(p => p.status === 'Pending').length}</span>` : ''}
                             </button>
                             <button onclick="openCreateBRModal()" class="bg-orange-600 hover:bg-orange-700 p-2 rounded text-xs transition">
                                 <i class="fas fa-plus-circle mr-1"></i> Create BR Match
                             </button>
                             <button onclick="openManageBRTournamentsModal()" class="bg-orange-500 hover:bg-orange-600 p-2 rounded text-xs transition">
                                 <i class="fas fa-list mr-1"></i> Manage BR Matches
                             </button>
                             <button onclick="openCSManageModal()" class="bg-blue-600 hover:bg-blue-700 p-2 rounded text-xs transition relative">
                                 <i class="fas fa-crosshairs mr-1"></i> CS Manage
                                 ${db.tournaments.filter(t => t.type === 'CS' && t.pendingAdminReview === true).length > 0 ? `<span class=\"absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center\">${db.tournaments.filter(t => t.type === 'CS' && t.pendingAdminReview === true).length}</span>` : ''}
                             </button>
                             <button onclick="openRedeemRequestsModal()" class="bg-purple-600 hover:bg-purple-700 p-2 rounded text-xs transition relative">
                                 <i class="fas fa-exchange-alt mr-1"></i> Redeem Requests
                                 ${db.redeemRequests.filter(p => p.status === 'Pending').length > 0 ? `<span class=\"absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center\">${db.redeemRequests.filter(p => p.status === 'Pending').length}</span>` : ''}
                             </button>
                             <button onclick="openManageStoreItemsModal()" class="bg-amber-700 hover:bg-amber-800 p-2 rounded text-xs transition">
                                 <i class="fas fa-boxes mr-1"></i> Manage Store Item
                             </button>
                             <button onclick="openEditRulesModal()" class="bg-slate-700 hover:bg-slate-600 p-2 rounded text-xs transition">
                                 <i class="fas fa-pencil-alt mr-1"></i> Edit Rule
                             </button>
                             <button onclick="openStoreManageModal()" class="bg-amber-600 hover:bg-amber-700 p-2 rounded text-xs transition relative col-span-2">
                                 <i class="fas fa-store mr-1"></i> Store Manage
                             </button>
                        </div>
                        <p class="text-xs text-slate-500 mt-2">Admin Email: ${ADMIN_EMAIL}</p>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        function toggleHistory(id) {
            const el = document.getElementById(id);
            el.classList.toggle('hidden');
        }

        function updateUsername(newName) {
            if(newName && newName !== currentUser.username) {
                currentUser.username = newName;
                const idx = db.users.findIndex(u => u.id === currentUser.id);
                if(idx !== -1) db.users[idx] = currentUser;
                saveDB();
                updateHeader();
            }
        }

        function updateUserUID(newUID) {
            if (!newUID || !/^\d{6,12}$/.test(newUID)) {
                alert('UID must be 6-12 digits only.');
                return;
            }
            currentUser.ffUID = newUID;
            const idx = db.users.findIndex(u => u.id === currentUser.id);
            if (idx !== -1) {
                db.users[idx].ffUID = newUID;
            }
            saveDB();
            updateHeader();
            alert('✅ FF UID updated successfully!');
        }

        // --- MODALS & TRANSACTIONS ---

        function closeModal() {
            document.getElementById('modal-overlay').classList.add('hidden');
        }

        function openAddMoneyModal() {
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            // Show user's pending payment requests
            const userPendingRequests = db.paymentRequests.filter(p => p.userId === currentUser.id && p.status === 'Pending');
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center">Add Stones</h3>
                <div class="space-y-4">
                    <div class="bg-green-500/20 border border-green-500 p-3 rounded text-center">
                        <p class="text-xs text-slate-300">eSewa Number</p>
                        <p class="text-xl font-bold text-green-400 copy-text cursor-pointer">9825827380</p>
                    </div>
                    
                    <div>
                        <label class="text-xs text-slate-400">Amount (NPR = Stones)</label>
                        <input type="number" id="payment-amount" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" placeholder="Enter amount paid">
                    </div>
                    
                    <div>
                        <label class="text-xs text-slate-400">Payment Screenshot</label>
                        <input type="file" id="payment-screenshot" class="w-full text-xs bg-slate-900 p-2 rounded border border-slate-700 mt-1">
                    </div>

                    <div>
                         <label class="text-xs text-slate-400">Remark (Your Username)</label>
                         <input type="text" value="${currentUser.username}" disabled class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-slate-500 text-sm">
                         <p class="text-[10px] text-red-400 mt-1">* Wrong remark = No Refund</p>
                    </div>

                    <button onclick="submitPayment()" class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold">Submit Payment</button>
                    
                    ${userPendingRequests.length > 0 ? `
                    <div class="mt-4 pt-4 border-t border-slate-700">
                        <h4 class="text-sm font-bold text-yellow-400 mb-2">⏳ Pending Requests</h4>
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            ${userPendingRequests.map(req => `
                                <div class="bg-slate-900 p-2 rounded text-xs flex justify-between items-center">
                                    <span>${req.amount} Stones</span>
                                    <span class="text-yellow-400">${req.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        function submitPayment() {
            const amount = parseInt(document.getElementById('payment-amount').value);
            const screenshotInput = document.getElementById('payment-screenshot');
            
            if (!amount || amount <= 0) {
                return alert("Please enter a valid amount.");
            }
            
            if (!screenshotInput.files || !screenshotInput.files[0]) {
                return alert("Please upload payment screenshot.");
            }
            
            const file = screenshotInput.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Create payment request with screenshot
                const paymentRequest = {
                    id: Date.now(),
                    userId: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email,
                    amount: amount,
                    screenshot: e.target.result, // Base64 encoded image
                    date: new Date().toISOString(),
                    status: 'Pending'
                };
                
                db.paymentRequests.push(paymentRequest);
                saveDB();
                
                alert("Payment Submitted! Admin will verify and add stones shortly.");
                closeModal();
            };
            
            reader.onerror = function() {
                alert("Error reading screenshot. Please try again.");
            };
            
            reader.readAsDataURL(file);
        }

        function openRedeemModal() {
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center">Redeem Stones</h3>
                <div class="space-y-4">
                     <div>
                        <label class="text-xs text-slate-400">Stones to Redeem</label>
                        <input type="number" id="redeem-amount" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm" placeholder="Min 100">
                    </div>

                    <div>
                        <label class="text-xs text-slate-400">Your QR Code</label>
                        <input type="file" id="redeem-qr" class="w-full text-xs bg-slate-900 p-2 rounded border border-slate-700 mt-1">
                    </div>

                    <button onclick="submitRedeem()" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold">Request Withdraw</button>
                </div>
            `;
        }

        function submitRedeem() {
            const amount = parseInt(document.getElementById('redeem-amount').value);
            const qrInput = document.getElementById('redeem-qr');
            
            if (!amount || amount <= 0) {
                return alert("Please enter a valid amount.");
            }
            if (amount > currentUser.stones) {
                return alert("Insufficient stones.");
            }
            
            if (!qrInput.files || !qrInput.files[0]) {
                return alert("Please upload your QR Code.");
            }
            
            const file = qrInput.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                updateStones(-amount);
                
                const redeemRequest = {
                    id: Date.now(),
                    userId: currentUser.id,
                    username: currentUser.username,
                    amount: amount,
                    qrCode: e.target.result,
                    date: new Date().toISOString(),
                    status: 'Pending'
                };
                
                db.redeemRequests.push(redeemRequest);
                saveDB();
                
                alert("Redeem Request Sent! Money will be sent to your QR.");
                closeModal();
            };
            
            reader.readAsDataURL(file);
        }

        function updateStones(amount) {
            // If Admin, always keep stones at max (Unlimited)
            if (currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin') {
                currentUser.stones = 999999;
            } else {
                currentUser.stones += amount;
            }

            const idx = db.users.findIndex(u => u.id === currentUser.id);
            if(idx !== -1) db.users[idx] = currentUser;
            saveDB();
            updateHeader();
            if(document.getElementById('header-stones')) {
                document.getElementById('header-stones').innerText = currentUser.stones;
            }
        }

        // --- ADMIN FUNCTIONS ---

        function openPaymentRequestsModal() {
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            const pendingRequests = db.paymentRequests.filter(p => p.status === 'Pending');
            const processedRequests = db.paymentRequests.filter(p => p.status !== 'Pending').slice(-10).reverse();
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-credit-card mr-2 text-green-400"></i>Payment Requests</h3>
                
                <!-- Pending Requests -->
                <div class="mb-4">
                    <h4 class="text-sm font-bold text-yellow-400 mb-2 flex items-center">
                        <i class="fas fa-clock mr-2"></i>Pending (${pendingRequests.length})
                    </h4>
                    ${pendingRequests.length === 0 ? `
                        <p class="text-slate-500 text-sm text-center py-4">No pending requests</p>
                    ` : `
                        <div class="space-y-3 max-h-[60vh] overflow-y-auto">
                            ${pendingRequests.map(req => `
                                <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <p class="font-bold text-white">${req.username}</p>
                                            <p class="text-xs text-slate-400">${req.email}</p>
                                            <p class="text-xs text-slate-500">${new Date(req.date).toLocaleString()}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-lg font-bold text-yellow-400">${req.amount}</p>
                                            <p class="text-xs text-slate-400">Stones</p>
                                        </div>
                                    </div>
                                    
                                    <!-- Payment Screenshot -->
                                    ${req.screenshot ? `
                                    <div class="mb-3">
                                        <p class="text-xs text-slate-400 mb-1"><i class="fas fa-image mr-1"></i>Payment Screenshot:</p>
                                        <div class="relative">
                                            <img src="${req.screenshot}" alt="Payment Screenshot" class="w-full rounded-lg border border-slate-600 cursor-pointer hover:opacity-90 transition" onclick="viewScreenshot('${req.id}')">
                                            <button onclick="viewScreenshot('${req.id}')" class="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs hover:bg-black/80 transition">
                                                <i class="fas fa-expand mr-1"></i>View Full
                                            </button>
                                        </div>
                                    </div>
                                    ` : `
                                    <div class="mb-3 bg-slate-800 p-2 rounded text-center">
                                        <p class="text-xs text-slate-500"><i class="fas fa-image mr-1"></i>No screenshot uploaded</p>
                                    </div>
                                    `}
                                    
                                    <div class="flex gap-2">
                                        <button onclick="approvePayment(${req.id})" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold transition">
                                            <i class="fas fa-check mr-1"></i> Approve
                                        </button>
                                        <button onclick="rejectPayment(${req.id})" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs font-bold transition">
                                            <i class="fas fa-times mr-1"></i> Reject
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
                
                <!-- Processed Requests History -->
                <div class="border-t border-slate-700 pt-4">
                    <h4 class="text-sm font-bold text-slate-400 mb-2 flex items-center">
                        <i class="fas fa-history mr-2"></i>Recent History
                    </h4>
                    ${processedRequests.length === 0 ? `
                        <p class="text-slate-500 text-xs text-center py-2">No history yet</p>
                    ` : `
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            ${processedRequests.map(req => `
                                <div class="bg-slate-900/50 p-2 rounded text-xs flex justify-between items-center">
                                    <div>
                                        <span class="text-white">${req.username}</span>
                                        <span class="text-slate-500 ml-2">${req.amount} stones</span>
                                    </div>
                                    <span class="${req.status === 'Approved' ? 'text-green-400' : 'text-red-400'}">${req.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        }
        
        // View screenshot in fullscreen modal
        function viewScreenshot(requestId) {
            const request = db.paymentRequests.find(p => p.id === parseInt(requestId));
            if (!request || !request.screenshot) return;
            
            // Create fullscreen overlay
            const overlay = document.createElement('div');
            overlay.id = 'screenshot-overlay';
            overlay.className = 'fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4';
            overlay.innerHTML = `
                <div class="relative w-full max-w-lg">
                    <button onclick="closeScreenshot()" class="absolute -top-10 right-0 text-white text-xl hover:text-red-400 transition">
                        <i class="fas fa-times"></i> Close
                    </button>
                    <img src="${request.screenshot}" alt="Payment Screenshot" class="w-full rounded-lg shadow-2xl">
                    <div class="mt-4 bg-slate-800 p-3 rounded-lg">
                        <div class="flex justify-between items-center text-sm">
                            <div>
                                <p class="font-bold text-white">${request.username}</p>
                                <p class="text-xs text-slate-400">${request.email}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xl font-bold text-yellow-400">${request.amount} <span class="text-sm">Stones</span></p>
                                <p class="text-xs text-slate-500">${new Date(request.date).toLocaleString()}</p>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-3">
                            <button onclick="closeScreenshot(); approvePayment(${request.id})" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition">
                                <i class="fas fa-check mr-1"></i> Approve
                            </button>
                            <button onclick="closeScreenshot(); rejectPayment(${request.id})" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold transition">
                                <i class="fas fa-times mr-1"></i> Reject
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        function closeScreenshot() {
            const overlay = document.getElementById('screenshot-overlay');
            if (overlay) overlay.remove();
        }

        function approvePayment(requestId) {
            const reqIndex = db.paymentRequests.findIndex(p => p.id === requestId);
            if (reqIndex === -1) return alert("Request not found.");
            
            const request = db.paymentRequests[reqIndex];
            
            if (confirm(`Approve payment of ${request.amount} stones for ${request.username}?`)) {
                // Update request status
                db.paymentRequests[reqIndex].status = 'Approved';
                db.paymentRequests[reqIndex].processedAt = new Date().toISOString();
                db.paymentRequests[reqIndex].processedBy = currentUser.username;
                
                // Add stones to user
                const userIndex = db.users.findIndex(u => u.id === request.userId);
                if (userIndex !== -1) {
                    db.users[userIndex].stones += request.amount;
                    
                    // Add transaction record
                    db.transactions.push({
                        id: Date.now(),
                        userId: request.userId,
                        type: 'credit',
                        amount: request.amount,
                        description: 'Payment Approved',
                        date: new Date().toISOString()
                    });
                }
                
                saveDB();
                alert(`✅ Approved! ${request.amount} stones added to ${request.username}'s account.`);
                openPaymentRequestsModal(); // Refresh modal
                renderProfile(); // Refresh profile page in background
            }
        }

        function rejectPayment(requestId) {
            const reqIndex = db.paymentRequests.findIndex(p => p.id === requestId);
            if (reqIndex === -1) return alert("Request not found.");
            
            const request = db.paymentRequests[reqIndex];
            
            const reason = prompt(`Reject payment of ${request.amount} stones for ${request.username}?\n\nEnter rejection reason (optional):`);
            
            if (reason !== null) {
                // Update request status
                db.paymentRequests[reqIndex].status = 'Rejected';
                db.paymentRequests[reqIndex].processedAt = new Date().toISOString();
                db.paymentRequests[reqIndex].processedBy = currentUser.username;
                db.paymentRequests[reqIndex].rejectionReason = reason || 'No reason provided';
                
                saveDB();
                alert(`❌ Rejected! Payment request from ${request.username} has been declined.`);
                openPaymentRequestsModal(); // Refresh modal
                renderProfile(); // Refresh profile page in background
            }
        }

        function openManageUsersModal() {
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            const users = db.users.filter(u => u.role !== 'admin');
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-users mr-2 text-blue-400"></i>Manage Users</h3>
                
                <div class="mb-3">
                    <input type="text" id="user-search" placeholder="Search by username or email..." 
                           class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-sm text-white"
                           oninput="filterUsers(this.value)">
                </div>
                
                <div id="users-list" class="space-y-2 max-h-80 overflow-y-auto">
                    ${users.length === 0 ? `
                        <p class="text-slate-500 text-sm text-center py-4">No users found</p>
                    ` : users.map(user => `
                        <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 user-item" data-search="${user.username.toLowerCase()} ${user.email.toLowerCase()}">
                            <div class="flex justify-between items-center mb-2">
                                <div class="flex items-center gap-2">
                                    <img src="${user.avatar}" class="w-8 h-8 rounded-full">
                                    <div>
                                        <p class="font-bold text-sm text-white">${user.username}</p>
                                        <p class="text-xs text-slate-400">${user.email}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-yellow-400 font-bold">${user.stones}</p>
                                    <p class="text-[10px] text-slate-500">stones</p>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <input type="number" id="send-stones-${user.id}" placeholder="Amount" class="flex-1 bg-slate-800 p-1.5 rounded border border-slate-600 text-white text-xs min-w-[90px]">
                                <button onclick="sendStonesToUser(${user.id})" class="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-bold transition">
                                    <i class="fas fa-paper-plane mr-1"></i>Send
                                </button>
                                <button onclick="deductStonesFromUser(${user.id})" class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 rounded text-xs font-bold transition">
                                    <i class="fas fa-minus mr-1"></i>Deduct
                                </button>
                                <button onclick="deleteUser(${user.id})" class="bg-red-700 hover:bg-red-800 px-3 py-1.5 rounded text-xs font-bold transition">
                                    <i class="fas fa-user-slash mr-1"></i>Remove
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <p class="text-xs text-slate-500 mt-3 text-center">Total Users: ${users.length}</p>
            `;
        }

        function filterUsers(query) {
            const items = document.querySelectorAll('.user-item');
            items.forEach(item => {
                const searchText = item.dataset.search;
                if (searchText.includes(query.toLowerCase())) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        function sendStonesToUser(userId) {
            const amountInput = document.getElementById(`send-stones-${userId}`);
            const amount = parseInt(amountInput.value);
            
            if (!amount || amount <= 0) {
                return alert("Please enter a valid amount.");
            }
            
            const userIndex = db.users.findIndex(u => u.id === userId);
            if (userIndex === -1) return alert("User not found.");
            
            const user = db.users[userIndex];
            
            if (confirm(`Send ${amount} stones to ${user.username}?`)) {
                db.users[userIndex].stones += amount;
                
                // Add transaction record
                db.transactions.push({
                    id: Date.now(),
                    userId: userId,
                    type: 'credit',
                    amount: amount,
                    description: 'Admin sent stones',
                    date: new Date().toISOString(),
                    addedBy: currentUser.username
                });
                
                saveDB();
                alert(`✅ Success! Sent ${amount} stones to ${user.username}.`);
                openManageUsersModal(); // Refresh modal
            }
        }

        function deductStonesFromUser(userId) {
            const amountInput = document.getElementById(`send-stones-${userId}`);
            const amount = parseInt(amountInput.value);
            
            if (!amount || amount <= 0) {
                return alert("Please enter a valid amount.");
            }
            
            const userIndex = db.users.findIndex(u => u.id === userId);
            if (userIndex === -1) return alert("User not found.");
            
            const user = db.users[userIndex];
            
            if (user.stones < amount) {
                return alert(`User only has ${user.stones} stones. Cannot deduct ${amount}.`);
            }
            
            const reason = prompt(`Deduct ${amount} stones from ${user.username}?\n\nEnter reason (optional):`);
            
            if (reason !== null) {
                db.users[userIndex].stones -= amount;
                
                // Add transaction record
                db.transactions.push({
                    id: Date.now(),
                    userId: userId,
                    type: 'debit',
                    amount: amount,
                    description: reason || 'Admin deducted stones',
                    date: new Date().toISOString(),
                    deductedBy: currentUser.username
                });
                
                saveDB();
                alert(`✅ Success! Deducted ${amount} stones from ${user.username}.`);
                openManageUsersModal(); // Refresh modal
            }
        }

        function deleteUser(userId) {
            const userIndex = db.users.findIndex(u => u.id === userId);
            if (userIndex === -1) return alert('User not found.');

            const user = db.users[userIndex];
            if (user.email === ADMIN_EMAIL || user.role === 'admin') {
                return alert('You cannot remove the admin account.');
            }

            const confirmDelete = confirm(`Remove account for ${user.username}? This will permanently delete their Special TP account.`);
            if (!confirmDelete) return;

            // Clean up related data (optional but safer)
            const uid = user.id;
            db.paymentRequests = db.paymentRequests.filter(p => p.userId !== uid);
            db.redeemRequests = db.redeemRequests.filter(r => r.userId !== uid);
            db.orders = db.orders.filter(o => o.userId !== uid);
            db.transactions = db.transactions.filter(t => t.userId !== uid);
            db.tournaments = db.tournaments.filter(t => t.userId !== uid && t.opponentId !== uid && t.parentTournamentId !== uid);

            // Remove user from list
            db.users.splice(userIndex, 1);

            saveDB();
            alert('User account removed from Special TP.');
            openManageUsersModal();
        }

        function openAdminAddStonesModal() {
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            const users = db.users.filter(u => u.role !== 'admin');
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-coins mr-2 text-yellow-400"></i>Add Stones to User</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="text-xs text-slate-400">Select User</label>
                        <select id="admin-add-user" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1">
                            <option value="">-- Select User --</option>
                            ${users.map(u => `<option value="${u.id}">${u.username} (${u.stones} stones)</option>`).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="text-xs text-slate-400">Amount to Add</label>
                        <input type="number" id="admin-add-amount" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" placeholder="Enter stones amount">
                    </div>
                    
                    <div>
                        <label class="text-xs text-slate-400">Reason (optional)</label>
                        <input type="text" id="admin-add-reason" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" placeholder="e.g., Tournament prize, bonus">
                    </div>
                    
                    <button onclick="adminAddStones()" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-bold transition">
                        <i class="fas fa-plus mr-1"></i> Add Stones
                    </button>
                </div>
            `;
        }

        function adminAddStones() {
            const userId = parseInt(document.getElementById('admin-add-user').value);
            const amount = parseInt(document.getElementById('admin-add-amount').value);
            const reason = document.getElementById('admin-add-reason').value || 'Admin addition';
            
            if (!userId) return alert("Please select a user.");
            if (!amount || amount <= 0) return alert("Please enter a valid amount.");
            
            const userIndex = db.users.findIndex(u => u.id === userId);
            if (userIndex === -1) return alert("User not found.");
            
            const user = db.users[userIndex];
            
            if (confirm(`Add ${amount} stones to ${user.username}?`)) {
                db.users[userIndex].stones += amount;
                
                // Add transaction record
                db.transactions.push({
                    id: Date.now(),
                    userId: userId,
                    type: 'credit',
                    amount: amount,
                    description: reason,
                    date: new Date().toISOString(),
                    addedBy: currentUser.username
                });
                
                saveDB();
                alert(`✅ Success! Added ${amount} stones to ${user.username}'s account.`);
                closeModal();
            }
        }

        function openCreateBRModal() {
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-plus-circle mr-2 text-orange-400"></i>Create BR Tournament</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="text-xs text-slate-400">Tournament Type</label>
                        <select id="br-type" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" onchange="onBRTypeChange()">
                            <option value="BR Survival">BR Survival</option>
                            <option value="BR Per Kill">BR Per Kill</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="text-xs text-slate-400">Entry Fee (Stones)</label>
                        <input type="number" id="br-fee" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" placeholder="50" value="50">
                    </div>
                    
                    <div>
                        <label class="text-xs text-slate-400">Match Time</label>
                        <input type="time" id="br-time" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3" id="bonus-fields">
                        <div id="survival-bonus-field">
                            <label class="text-xs text-slate-400">Survival Bonus (%)</label>
                            <input type="number" id="br-survival-bonus" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" placeholder="200" value="200">
                        </div>
                        <div id="kill-bonus-field" class="hidden">
                            <label class="text-xs text-slate-400">Per Kill Bonus (%)</label>
                            <input type="number" id="br-kill-bonus" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" placeholder="40" value="40">
                        </div>
                        <div>
                            <label class="text-xs text-slate-400">Booyah Bonus (%)</label>
                            <input type="number" id="br-booyah-bonus" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" placeholder="250" value="250">
                        </div>
                        <div>
                            <label class="text-xs text-slate-400">Maximum Players</label>
                            <input type="number" id="br-max-players" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" placeholder="48" value="48">
                        </div>
                    </div>
                    
                    <div class="bg-slate-800 p-3 rounded text-xs">
                        <p class="text-slate-400 mb-2">Preview:</p>
                        <p class="flex justify-between"><span>Tournament:</span> <span id="preview-type">BR Survival</span></p>
                        <p class="flex justify-between"><span>Entry Fee:</span> <span id="preview-fee">50</span></p>
                        <p class="flex justify-between" id="preview-bonus-row"><span id="preview-bonus-label">Survival:</span> <span id="preview-bonus-value">200%</span></p>
                        <p class="flex justify-between"><span>Booyah:</span> <span id="preview-booyah">250%</span></p>
                        <p class="flex justify-between"><span>Max Players:</span> <span id="preview-max-players">48</span></p>
                    </div>
                    
                    <button onclick="createBRAdmin()" class="w-full bg-orange-600 hover:bg-orange-700 py-2 rounded font-bold transition">
                        <i class="fas fa-plus mr-1"></i> Create Tournament
                    </button>
                </div>
            `;
            
            // Add event listeners for preview updates
            document.getElementById('br-type').addEventListener('change', updateBRPreview);
            document.getElementById('br-fee').addEventListener('input', updateBRPreview);
            document.getElementById('br-survival-bonus').addEventListener('input', updateBRPreview);
            document.getElementById('br-kill-bonus').addEventListener('input', updateBRPreview);
            document.getElementById('br-booyah-bonus').addEventListener('input', updateBRPreview);
            
            // Initialize view
            onBRTypeChange();
        }
        
        function onBRTypeChange() {
            const type = document.getElementById('br-type').value;
            const survivalField = document.getElementById('survival-bonus-field');
            const killField = document.getElementById('kill-bonus-field');
            
            if (type === 'BR Per Kill') {
                survivalField.classList.add('hidden');
                killField.classList.remove('hidden');
            } else {
                survivalField.classList.remove('hidden');
                killField.classList.add('hidden');
            }
            
            updateBRPreview();
        }
        
        function updateBRPreview() {
            const type = document.getElementById('br-type').value;
            const fee = document.getElementById('br-fee').value || 50;
            const survivalBonus = document.getElementById('br-survival-bonus').value || 200;
            const killBonus = document.getElementById('br-kill-bonus').value || 40;
            const booyahBonus = document.getElementById('br-booyah-bonus').value || 250;
            
            document.getElementById('preview-type').textContent = type;
            document.getElementById('preview-fee').textContent = fee;
            document.getElementById('preview-booyah').textContent = booyahBonus + '%';
            
            // Update bonus label and value based on type
            if (type === 'BR Per Kill') {
                document.getElementById('preview-bonus-label').textContent = 'Per Kill:';
                document.getElementById('preview-bonus-value').textContent = killBonus + '%';
            } else {
                document.getElementById('preview-bonus-label').textContent = 'Survival:';
                document.getElementById('preview-bonus-value').textContent = survivalBonus + '%';
            }
        }
        
        function createBRAdmin() {
            const type = document.getElementById('br-type').value;
            const fee = parseInt(document.getElementById('br-fee').value);
            const time = document.getElementById('br-time').value;
            const survivalBonus = document.getElementById('br-survival-bonus').value || 200;
            const killBonus = document.getElementById('br-kill-bonus').value || 40;
            const booyahBonus = document.getElementById('br-booyah-bonus').value;
            const maxPlayers = parseInt(document.getElementById('br-max-players').value) || 48;
            
            if (!fee || fee <= 0) return alert("Please enter valid entry fee.");
            if (!time) return alert("Please select match time.");
            if (!maxPlayers || maxPlayers <= 0) return alert("Please enter valid max players.");
            
            // Set the appropriate bonus based on tournament type
            let bonusType, bonusValue;
            if (type === 'BR Per Kill') {
                bonusType = 'killBonus';
                bonusValue = killBonus + '%';
            } else {
                bonusType = 'survivalBonus';
                bonusValue = survivalBonus + '%';
            }
            
            const tournament = {
                id: Date.now(),
                type: type,
                userId: null, // Admin created
                status: 'Upcoming',
                fee: fee,
                date: new Date().toISOString(),
                time: time,
                [bonusType]: bonusValue,
                booyahBonus: booyahBonus + '%',
                maxPlayers: maxPlayers,
                createdBy: 'Admin'
            };
            
            db.tournaments.push(tournament);
            saveDB();
            
            const bonusLabel = type === 'BR Per Kill' ? 'Per Kill' : 'Survival';
            alert(`✅ Tournament Created!\n\n${type}\nEntry Fee: ${fee} stones\nTime: ${time}\n${bonusLabel}: ${bonusValue}\nBooyah: ${booyahBonus}%`);
            closeModal();
            renderHome();
        }

        function openRedeemRequestsModal() {
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            const pendingRequests = db.redeemRequests.filter(p => p.status === 'Pending');
            const processedRequests = db.redeemRequests.filter(p => p.status !== 'Pending').slice(-10).reverse();
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-exchange-alt mr-2 text-purple-400"></i>Redeem Requests</h3>
                
                <!-- Pending Requests -->
                <div class="mb-4">
                    <h4 class="text-sm font-bold text-yellow-400 mb-2 flex items-center">
                        <i class="fas fa-clock mr-2"></i>Pending (${pendingRequests.length})
                    </h4>
                    ${pendingRequests.length === 0 ? `
                        <p class="text-slate-500 text-sm text-center py-4">No pending requests</p>
                    ` : `
                        <div class="space-y-3 max-h-[60vh] overflow-y-auto">
                            ${pendingRequests.map(req => `
                                <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <p class="font-bold text-white">${req.username}</p>
                                            <p class="text-xs text-slate-500">${new Date(req.date).toLocaleString()}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-lg font-bold text-purple-400">${req.amount}</p>
                                            <p class="text-xs text-slate-400">Stones</p>
                                        </div>
                                    </div>
                                    
                                    <!-- QR Code -->
                                    ${req.qrCode ? `
                                    <div class="mb-3">
                                        <p class="text-xs text-slate-400 mb-1"><i class="fas fa-qrcode mr-1"></i>QR Code:</p>
                                        <div class="relative">
                                            <img src="${req.qrCode}" class="w-full rounded-lg border border-slate-600 cursor-pointer hover:opacity-90 transition" onclick="viewRedeemQR('${req.id}')">
                                            <button onclick="viewRedeemQR('${req.id}')" class="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs hover:bg-black/80 transition">
                                                <i class="fas fa-expand mr-1"></i>View
                                            </button>
                                        </div>
                                    </div>
                                    ` : ''}
                                    
                                    <div class="flex gap-2">
                                        <button onclick="approveRedeem(${req.id})" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold transition">
                                            <i class="fas fa-check mr-1"></i> Sent
                                        </button>
                                        <button onclick="rejectRedeem(${req.id})" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs font-bold transition">
                                            <i class="fas fa-times mr-1"></i> Refund
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
                
                <!-- Processed History -->
                <div class="border-t border-slate-700 pt-4">
                    <h4 class="text-sm font-bold text-slate-400 mb-2 flex items-center">
                        <i class="fas fa-history mr-2"></i>Recent History
                    </h4>
                    ${processedRequests.length === 0 ? `
                        <p class="text-slate-500 text-xs text-center py-2">No history yet</p>
                    ` : `
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            ${processedRequests.map(req => `
                                <div class="bg-slate-900/50 p-2 rounded text-xs flex justify-between items-center">
                                    <div>
                                        <span class="text-white">${req.username}</span>
                                        <span class="text-slate-500 ml-2">${req.amount} stones</span>
                                    </div>
                                    <span class="${req.status === 'Approved' ? 'text-green-400' : 'text-red-400'}">${req.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        }

        function viewRedeemQR(requestId) {
            const request = db.redeemRequests.find(p => p.id === parseInt(requestId));
            if (!request || !request.qrCode) return;
            
            const overlay = document.createElement('div');
            overlay.id = 'screenshot-overlay';
            overlay.className = 'fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4';
            overlay.innerHTML = `
                <div class="relative w-full max-w-lg">
                    <button onclick="closeScreenshot()" class="absolute -top-10 right-0 text-white text-xl hover:text-red-400 transition">
                        <i class="fas fa-times"></i> Close
                    </button>
                    <img src="${request.qrCode}" class="w-full rounded-lg shadow-2xl">
                    <div class="mt-4 bg-slate-800 p-3 rounded-lg">
                        <div class="flex justify-between items-center text-sm">
                            <div>
                                <p class="font-bold text-white">${request.username}</p>
                                <p class="text-xs text-slate-400">Redeem Request</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xl font-bold text-purple-400">${request.amount} <span class="text-sm">Stones</span></p>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-3">
                            <button onclick="closeScreenshot(); approveRedeem(${request.id})" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition">
                                <i class="fas fa-check mr-1"></i> Confirm Sent
                            </button>
                            <button onclick="closeScreenshot(); rejectRedeem(${request.id})" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold transition">
                                <i class="fas fa-times mr-1"></i> Reject & Refund
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        function approveRedeem(requestId) {
            const reqIndex = db.redeemRequests.findIndex(p => p.id === requestId);
            if (reqIndex === -1) return alert("Request not found.");
            
            if (confirm("Confirm you have sent the money? This cannot be undone.")) {
                db.redeemRequests[reqIndex].status = 'Approved';
                db.redeemRequests[reqIndex].processedAt = new Date().toISOString();
                saveDB();
                openRedeemRequestsModal();
                renderProfile();
            }
        }

        function rejectRedeem(requestId) {
            const reqIndex = db.redeemRequests.findIndex(p => p.id === requestId);
            if (reqIndex === -1) return alert("Request not found.");
            const req = db.redeemRequests[reqIndex];
            
            const reason = prompt("Reason for rejection (Stones will be refunded):");
            if (reason !== null) {
                // Refund stones
                const userIdx = db.users.findIndex(u => u.id === req.userId);
                if (userIdx !== -1) {
                    db.users[userIdx].stones += req.amount;
                }
                
                db.redeemRequests[reqIndex].status = 'Rejected';
                db.redeemRequests[reqIndex].rejectionReason = reason;
                db.redeemRequests[reqIndex].processedAt = new Date().toISOString();
                
                // Log transaction
                db.transactions.push({
                    id: Date.now(),
                    userId: req.userId,
                    type: 'credit',
                    amount: req.amount,
                    description: 'Redeem Refund: ' + reason,
                    date: new Date().toISOString()
                });

                saveDB();
                alert("Refund successful.");
                openRedeemRequestsModal();
                renderProfile();
            }
        }

        // Manage BR tournaments created by Admin
        function openManageBRTournamentsModal() {
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');

            // Only show tournaments created by Admin (not user join entries that have parentTournamentId)
            const adminBRTournaments = db.tournaments.filter(t => t.createdBy === 'Admin');

            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-list mr-2 text-orange-400"></i>Manage BR Matches</h3>
                ${adminBRTournaments.length === 0 ? `
                    <p class="text-slate-500 text-sm text-center py-4">No BR matches created yet.</p>
                ` : `
                    <div class="space-y-3 max-h-[70vh] overflow-y-auto">
                        ${adminBRTournaments.map(t => `
                            <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <p class="font-bold text-orange-400">${t.type}</p>
                                        <p class="text-xs text-slate-500">Room #${t.id.toString().slice(-4)}</p>
                                        <p class="text-xs text-slate-500">Time: ${t.time || '-'} | Entry: ${t.fee} stones</p>
                                    </div>
                                    <span class="text-xs px-2 py-0.5 rounded ${t.status === 'Upcoming' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'}">${t.status}</span>
                                </div>
                                <div class="flex justify-between items-center text-[11px] text-slate-400 mb-2">
                                    <span>${t.type === 'BR Per Kill' ? 'Kill' : 'Survival'}: ${t.type === 'BR Per Kill' ? (t.killBonus || '-') : (t.survivalBonus || '-')}</span>
                                    <span>Booyah: ${t.booyahBonus || '-'}</span>
                                </div>

                                <!-- Joined Players -->
                                <div class="bg-slate-800/60 border border-slate-700 rounded mb-2 p-2">
                                    ${(() => {
                                        const joined = db.tournaments.filter(j => j.parentTournamentId === t.id);
                                        const maxP = t.maxPlayers || 48;
                                        return `
                                            <details>
                                                <summary class="cursor-pointer text-xs font-bold text-slate-300 flex items-center justify-between">
                                                    <span><i class="fas fa-users text-blue-400 mr-1"></i> Joined Players: ${joined.length}/${maxP}${joined.length >= maxP ? ' <span class="text-red-400">(FULL)</span>' : ''}</span>
                                                    <span class="text-slate-400 text-[10px]">Tap to view</span>
                                                </summary>
                                                <div class="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                                                    ${joined.length ? joined.map((j, i) => {
                                                        const u = db.users.find(x => x.id === j.userId);
                                                        const name = u?.username || j.username || 'User';
                                                        const uid = u?.ffUID || '-';
                                                        return `
                                                            <div class="bg-slate-900 border border-slate-700 rounded p-2 flex items-center justify-between">
                                                                <div class="flex items-center gap-2">
                                                                    <img src="${u?.avatar || 'https://ui-avatars.com/api/?name=User'}" class="w-6 h-6 rounded-full object-cover">
                                                                    <div class="leading-tight">
                                                                        <p class="text-xs font-bold text-white">${i + 1}. ${escapeHtml(name)}</p>
                                                                        <p class="text-[10px] text-slate-500">UID: ${escapeHtml(uid)}</p>
                                                                    </div>
                                                                </div>
                                                                <p class="text-[10px] text-slate-500">${j.date ? new Date(j.date).toLocaleDateString() : ''}</p>
                                                            </div>
                                                        `;
                                                    }).join('') : `
                                                        <p class="text-[11px] text-slate-500 text-center py-2">No players joined yet.</p>
                                                    `}
                                                </div>
                                            </details>
                                        `;
                                    })()}
                                </div>
                                
                                <!-- Room Credentials Section -->
                                <div class="bg-slate-800 p-2 rounded mb-2">
                                    <p class="text-xs text-slate-400 mb-1"><i class="fas fa-key mr-1"></i>Room Credentials:</p>
                                    <div class="grid grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label class="text-[10px] text-slate-500">Match ID</label>
                                            <input type="text" id="match-id-${t.id}" value="${t.matchId || ''}" placeholder="Enter ID" class="w-full bg-slate-900 p-1.5 rounded border border-slate-600 text-white text-xs">
                                        </div>
                                        <div>
                                            <label class="text-[10px] text-slate-500">Password</label>
                                            <input type="text" id="match-pass-${t.id}" value="${t.password || ''}" placeholder="Enter Password" class="w-full bg-slate-900 p-1.5 rounded border border-slate-600 text-white text-xs">
                                        </div>
                                    </div>
                                    <button onclick="saveRoomCredentials(${t.id})" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-xs font-bold transition">
                                        <i class="fas fa-save mr-1"></i> Save Credentials
                                    </button>
                                </div>
                                
                                <!-- Current Credentials Display -->
                                ${t.matchId || t.password ? `
                                <div class="bg-green-500/10 border border-green-500/30 p-2 rounded mb-2 text-xs">
                                    <p class="text-green-400 font-bold mb-1"><i class="fas fa-check-circle mr-1"></i>Active Credentials:</p>
                                    <p class="text-slate-300">Match ID: <span class="text-white font-bold">${t.matchId || 'Not set'}</span></p>
                                    <p class="text-slate-300">Password: <span class="text-white font-bold">${t.password || 'Not set'}</span></p>
                                </div>
                                ` : `
                                <div class="bg-yellow-500/10 border border-yellow-500/30 p-2 rounded mb-2 text-xs">
                                    <p class="text-yellow-400"><i class="fas fa-exclamation-triangle mr-1"></i>No credentials set yet</p>
                                </div>
                                `}
                                
                                <button onclick="deleteBRTournament(${t.id})" class="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs font-bold transition">
                                    <i class="fas fa-trash-alt mr-1"></i> Remove Match
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
            `;
        }
        
        function saveRoomCredentials(tournamentId) {
            const matchId = document.getElementById(`match-id-${tournamentId}`).value.trim();
            const password = document.getElementById(`match-pass-${tournamentId}`).value.trim();
            
            const tournamentIndex = db.tournaments.findIndex(t => t.id === tournamentId);
            if (tournamentIndex === -1) return alert("Tournament not found.");
            
            db.tournaments[tournamentIndex].matchId = matchId;
            db.tournaments[tournamentIndex].password = password;
            saveDB();
            
            alert(`✅ Credentials saved!\n\nMatch ID: ${matchId || 'Not set'}\nPassword: ${password || 'Not set'}\n\nUsers who joined will see these credentials.`);
            openManageBRTournamentsModal(); // Refresh modal
            renderHome(); // Refresh home
        }

        function deleteBRTournament(tournamentId) {
            const tournament = db.tournaments.find(t => t.id === tournamentId);
            if (!tournament) return alert('Tournament not found');

            if (!confirm(`Remove BR match "${tournament.type}" (Room #${tournament.id.toString().slice(-4)})?`)) return;

            // Remove the main tournament
            db.tournaments = db.tournaments.filter(t => t.id !== tournamentId && t.parentTournamentId !== tournamentId);
            saveDB();

            alert('Tournament and all joined entries removed successfully.');
            openManageBRTournamentsModal(); // refresh list
            renderHome(); // refresh home so removed match disappears
        }

        // --- CS MATCH FUNCTIONS ---
        
        function openCreateCSMatchModal() {
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-plus-circle mr-2 text-blue-400"></i>Create CS Match</h3>
                
                <div class="space-y-4">
                    <!-- Match Type Selection -->
                    <div>
                        <label class="text-xs text-slate-400">Match Type</label>
                        <select id="cs-match-type" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" onchange="updateCSMatchTypeOptions()">
                            <option value="Clash Squad">Clash Squad</option>
                            <option value="Lone Wolf">Lone Wolf</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs text-slate-400">Entry Fee (Stones)</label>
                            <input type="number" id="cs-fee" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" placeholder="50" value="50">
                        </div>
                        <div>
                            <label class="text-xs text-slate-400">Match Time</label>
                            <input type="time" id="cs-time" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs text-slate-400">Rounds</label>
                            <select id="cs-rounds" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1">
                                <option value="7">7 Rounds</option>
                                <option value="11">11 Rounds</option>
                                <option value="13">13 Rounds</option>
                            </select>
                        </div>
                        <div id="cs-coins-container">
                            <label class="text-xs text-slate-400">Starting Coins</label>
                            <select id="cs-coins" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1">
                                <option value="1500">1500</option>
                                <option value="500">500</option>
                                <option value="9950">9950</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="bg-slate-900 p-3 rounded border border-slate-700">
                        <p class="text-xs text-slate-400 mb-2">Match Settings:</p>
                        <div class="space-y-2">
                            <label class="flex items-center gap-2 text-sm">
                                <input type="checkbox" id="cs-headshot" checked class="rounded">
                                <span class="text-slate-300">Headshot Only</span>
                            </label>
                            <label class="flex items-center gap-2 text-sm">
                                <input type="checkbox" id="cs-ammo" checked class="rounded">
                                <span class="text-slate-300">Limited Ammo</span>
                            </label>
                            <label class="flex items-center gap-2 text-sm">
                                <input type="checkbox" id="cs-skills" class="rounded">
                                <span class="text-slate-300">Character Skills</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="bg-blue-900/30 p-3 rounded border border-blue-500/30">
                        <p class="text-xs text-slate-400 mb-1">Match Preview:</p>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-300">Entry Fee:</span>
                            <span class="text-white font-bold" id="cs-preview-fee">50 stones</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-300">Winner Prize (160%):</span>
                            <span class="text-green-400 font-bold" id="cs-preview-prize">80 stones</span>
                        </div>
                    </div>
                    
                    <button onclick="createCSMatch()" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-bold transition">
                        <i class="fas fa-plus mr-1"></i> Create Match
                    </button>
                </div>
            `;
            
            // Add event listener for fee preview
            document.getElementById('cs-fee').addEventListener('input', updateCSPreview);
            updateCSPreview();
        }
        
        function updateCSPreview() {
            const fee = parseInt(document.getElementById('cs-fee').value) || 0;
            document.getElementById('cs-preview-fee').textContent = fee + ' stones';
            document.getElementById('cs-preview-prize').textContent = Math.floor(fee * 1.6) + ' stones';
        }
        
        function updateCSMatchTypeOptions() {
            const matchType = document.getElementById('cs-match-type').value;
            const roundsSelect = document.getElementById('cs-rounds');
            const coinsContainer = document.getElementById('cs-coins-container');
            
            if (matchType === 'Lone Wolf') {
                // Lone Wolf: Rounds 9, 11, 13 - No coins option
                roundsSelect.innerHTML = `
                    <option value="9">9 Rounds</option>
                    <option value="11">11 Rounds</option>
                    <option value="13">13 Rounds</option>
                `;
                coinsContainer.classList.add('hidden');
            } else {
                // Clash Squad: Rounds 7, 11, 13 - Has coins option
                roundsSelect.innerHTML = `
                    <option value="7">7 Rounds</option>
                    <option value="11">11 Rounds</option>
                    <option value="13">13 Rounds</option>
                `;
                coinsContainer.classList.remove('hidden');
            }
        }
        
        function createCSMatch() {
            const matchType = document.getElementById('cs-match-type').value;
            const fee = parseInt(document.getElementById('cs-fee').value);
            const time = document.getElementById('cs-time').value;
            const rounds = parseInt(document.getElementById('cs-rounds').value);
            const coinsEl = document.getElementById('cs-coins');
            const coins = coinsEl ? parseInt(coinsEl.value) : 0;
            const headshot = document.getElementById('cs-headshot').checked;
            const limitedAmmo = document.getElementById('cs-ammo').checked;
            const skills = document.getElementById('cs-skills').checked;
            
            if (!fee || fee <= 0) return alert("Please enter a valid entry fee.");
            if (!time) return alert("Please select match time.");
            
            if (currentUser.stones < fee) {
                alert(`Insufficient Stones! You need ${fee} stones to create this match.`);
                closeModal();
                openAddMoneyModal();
                return;
            }
            
            if (confirm(`Create ${matchType} Match for ${fee} stones?\n\nWinner Prize: ${Math.floor(fee * 1.6)} stones\nRounds: ${rounds}\nTime: ${time}`)) {
                updateStones(-fee);
                
                const match = {
                    id: Date.now(),
                    type: 'CS',
                    matchType: matchType,
                    userId: currentUser.id,
                    username: currentUser.username,
                    status: 'Waiting',
                    fee: fee,
                    time: time,
                    rounds: rounds,
                    coins: matchType === 'Clash Squad' ? coins : null,
                    headshot: headshot,
                    limitedAmmo: limitedAmmo,
                    skills: skills,
                    date: new Date().toISOString(),
                    createdBy: 'User'
                };
                
                db.tournaments.push(match);
                saveDB();
                
                alert(`✅ ${matchType} Match Created!\n\nRoom #${match.id.toString().slice(-4)}\nEntry: ${fee} stones\nWaiting for opponent...`);
                closeModal();
                renderCS();
            }
        }
        
        function joinCSMatch(matchId) {
            const match = db.tournaments.find(t => t.id === matchId);
            if (!match) return alert("Match not found!");
            
            if (match.userId === currentUser.id) {
                return alert("You cannot join your own match!");
            }
            
            if (match.status === 'Pending Approval') {
                return alert("This match already has a pending join request!");
            }
            
            if (currentUser.stones < match.fee) {
                alert(`Insufficient Stones! You need ${match.fee} stones to join.`);
                openAddMoneyModal();
                return;
            }
            
            const creator = db.users.find(u => u.id === match.userId);
            
            if (confirm(`Join CS Match vs ${creator?.username || 'Unknown'}?\n\nEntry Fee: ${match.fee} stones\nWinner Prize: ${Math.floor(match.fee * 1.6)} stones\nRounds: ${match.rounds}\nTime: ${match.time}`)) {
                updateStones(-match.fee);
                
                // Update match status to Pending Approval (creator must accept)
                const matchIndex = db.tournaments.findIndex(t => t.id === matchId);
                db.tournaments[matchIndex].status = 'Pending Approval';
                db.tournaments[matchIndex].opponentId = currentUser.id;
                db.tournaments[matchIndex].opponentUsername = currentUser.username;
                
                saveDB();
                
                alert(`✅ Join Request Sent!\n\nRoom #${match.id.toString().slice(-4)}\nvs ${creator?.username || 'Unknown'}\n\nWaiting for ${creator?.username || 'creator'} to accept your request.`);
                renderCS();
            }
        }
        
        function acceptCSMatch(matchId) {
            const match = db.tournaments.find(t => t.id === matchId);
            if (!match) return alert("Match not found!");

            if (match.userId !== currentUser.id) {
                return alert("Only the match creator can accept requests!");
            }

            const opponent = db.users.find(u => u.id === match.opponentId);

            if (confirm(`Accept ${opponent?.username || 'Unknown'}'s join request?\n\nThe match will start after acceptance.`)) {
                const matchIndex = db.tournaments.findIndex(t => t.id === matchId);

                // Activate match
                db.tournaments[matchIndex].status = 'Active';
                db.tournaments[matchIndex].acceptedAt = new Date().toISOString();
                db.tournaments[matchIndex].startTime = new Date().toISOString();

                // Initialize reporting state
                db.tournaments[matchIndex].creatorReported = false;
                db.tournaments[matchIndex].opponentReported = false;
                db.tournaments[matchIndex].creatorResult = null;
                db.tournaments[matchIndex].opponentResult = null;
                db.tournaments[matchIndex].creatorScreenshot = null;
                db.tournaments[matchIndex].opponentScreenshot = null;

                // Admin review flags
                db.tournaments[matchIndex].pendingAdminReview = false;
                db.tournaments[matchIndex].pendingReviewAt = null;

                saveDB();

                alert(`✅ Match Started!\n\nRoom #${match.id.toString().slice(-4)}\nvs ${opponent?.username || 'Unknown'}\n\nAfter match: both players must tap Won/Lost and upload screenshot. Then it goes to Pending Review for admin.`);
                renderCS();
            }
        }
        
        function rejectCSMatch(matchId) {
            const match = db.tournaments.find(t => t.id === matchId);
            if (!match) return alert("Match not found!");
            
            if (match.userId !== currentUser.id) {
                return alert("Only the match creator can reject requests!");
            }
            
            const opponent = db.users.find(u => u.id === match.opponentId);
            
            if (confirm(`Reject ${opponent?.username || 'Unknown'}'s join request?\n\nTheir ${match.fee} stones will be refunded.`)) {
                // Refund stones to opponent
                const opponentIndex = db.users.findIndex(u => u.id === match.opponentId);
                if (opponentIndex !== -1) {
                    db.users[opponentIndex].stones += match.fee;
                    
                    // Add refund transaction
                    db.transactions.push({
                        id: Date.now(),
                        userId: match.opponentId,
                        type: 'credit',
                        amount: match.fee,
                        description: 'CS Match Join Request Rejected - Refund',
                        date: new Date().toISOString()
                    });
                }
                
                // Reset match status to Waiting
                const matchIndex = db.tournaments.findIndex(t => t.id === matchId);
                db.tournaments[matchIndex].status = 'Waiting';
                db.tournaments[matchIndex].opponentId = null;
                db.tournaments[matchIndex].opponentUsername = null;
                
                saveDB();
                
                alert(`❌ Request Rejected!\n\n${opponent?.username || 'Unknown'}'s join request has been rejected.\n${match.fee} stones refunded to their account.\n\nYour match is now open for others to join.`);
                renderCS();
            }
        }
        
        function cancelCSMatch(matchId) {
            const match = db.tournaments.find(t => t.id === matchId);
            if (!match) return alert("Match not found!");
            
            if (match.userId !== currentUser.id) {
                return alert("You can only cancel your own matches!");
            }
            
            if (match.status === 'Active' && match.opponentId) {
                return alert("Cannot cancel! Opponent has already joined.");
            }
            
            if (confirm(`Cancel CS Match #${match.id.toString().slice(-4)}?\n\nYour ${match.fee} stones will be refunded.`)) {
                // Refund stones
                updateStones(match.fee);
                
                // Update match status
                const matchIndex = db.tournaments.findIndex(t => t.id === matchId);
                db.tournaments[matchIndex].status = 'Cancelled';
                
                saveDB();
                
                alert(`✅ Match Cancelled!\n\n${match.fee} stones refunded to your account.`);
                renderCS();
            }
        }

        function removeCSMatch(matchId) {
            const match = db.tournaments.find(t => t.id === matchId);
            if (!match) return alert("Match not found!");
            
            if (match.userId !== currentUser.id) {
                return alert("You can only remove your own matches!");
            }
            
            if (match.status !== 'Waiting') {
                return alert("Cannot remove! Someone has already joined or the match is active.");
            }
            
            if (confirm(`Remove CS Match #${match.id.toString().slice(-4)}?\n\nYour ${match.fee} stones will be refunded.`)) {
                // Refund stones to creator
                updateStones(match.fee);
                
                // Remove the match from database
                db.tournaments = db.tournaments.filter(t => t.id !== matchId);
                
                saveDB();
                
                alert(`✅ Match Removed!\n\n${match.fee} stones refunded to your account.`);
                renderCS();
            }
        }

        function saveCSCredentials(matchId) {
            const roomId = document.getElementById(`cs-id-${matchId}`).value.trim();
            const roomPassword = document.getElementById(`cs-pass-${matchId}`).value.trim();
            
            const matchIndex = db.tournaments.findIndex(t => t.id === matchId);
            if (matchIndex === -1) return alert("Match not found.");
            
            db.tournaments[matchIndex].roomId = roomId;
            db.tournaments[matchIndex].roomPassword = roomPassword;
            saveDB();
            
            alert(`✅ Credentials Saved!\n\nMatch ID: ${roomId || 'Not set'}\nPassword: ${roomPassword || 'Not set'}`);
            renderCS();
        }

        function sendCSCredentialsToOpponent(matchId) {
            const match = db.tournaments.find(t => t.id === matchId);
            if (!match) return alert("Match not found!");
            
            if (!match.roomId || !match.roomPassword) {
                return alert("Please save credentials first before sending!");
            }
            
            const opponent = db.users.find(u => u.id === match.opponentId);
            
            if (confirm(`Send credentials to ${opponent?.username || 'Opponent'}?\n\nMatch ID: ${match.roomId}\nPassword: ${match.roomPassword}`)) {
                const matchIndex = db.tournaments.findIndex(t => t.id === matchId);
                db.tournaments[matchIndex].credentialsSent = true;
                db.tournaments[matchIndex].sentAt = new Date().toISOString();
                saveDB();
                
                alert(`✅ Credentials Sent!\n\n${opponent?.username || 'Opponent'} can now see the Room ID and Password.`);
                renderCS();
            }
        }

        // Forgot Password Modal
        function openForgotPasswordModal() {
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-key mr-2 text-yellow-400"></i>Forgot Password</h3>
                
                <div class="space-y-4">
                    <div class="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
                        <p class="text-xs text-yellow-400"><i class="fas fa-info-circle mr-1"></i>Enter your registered email to reset your password.</p>
                    </div>
                    
                    <div>
                        <label class="text-xs text-slate-400">Registered Email</label>
                        <input type="email" id="forgot-email" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1" placeholder="example@gmail.com">
                    </div>
                    
                    <button onclick="verifyEmailForReset()" class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold transition">
                        <i class="fas fa-search mr-1"></i> Find Account
                    </button>
                </div>
            `;
        }
        
        function verifyEmailForReset() {
            const email = document.getElementById('forgot-email').value.trim();
            
            if (!email) return alert("Please enter your email.");
            
            const user = db.users.find(u => u.email === email);
            
            if (!user) {
                return alert("❌ No account found with this email address.");
            }
            
            // Show reset password form
            const modal = document.getElementById('modal-body');
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-lock mr-2 text-green-400"></i>Reset Password</h3>
                
                <div class="space-y-4">
                    <div class="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
                        <p class="text-xs text-green-400"><i class="fas fa-check-circle mr-1"></i>Account found: <strong>${user.username}</strong></p>
                        <p class="text-xs text-slate-400 mt-1">${user.email}</p>
                    </div>
                    
                    <div>
                        <label class="text-xs text-slate-400">New Password</label>
                        <div class="relative">
                            <input type="password" id="reset-new-password" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1 pr-10" placeholder="Enter new password (min 6 chars)">
                            <button type="button" onclick="toggleResetPasswordVisibility('reset-new-password', 'reset-new-icon')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white mt-0.5">
                                <i id="reset-new-icon" class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <label class="text-xs text-slate-400">Confirm New Password</label>
                        <div class="relative">
                            <input type="password" id="reset-confirm-password" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm mt-1 pr-10" placeholder="Confirm new password">
                            <button type="button" onclick="toggleResetPasswordVisibility('reset-confirm-password', 'reset-confirm-icon')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white mt-0.5">
                                <i id="reset-confirm-icon" class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <button onclick="resetPassword('${user.id}')" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-bold transition">
                        <i class="fas fa-save mr-1"></i> Reset Password
                    </button>
                    
                    <button onclick="openForgotPasswordModal()" class="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold transition text-sm">
                        <i class="fas fa-arrow-left mr-1"></i> Back
                    </button>
                </div>
            `;
        }
        
        function toggleResetPasswordVisibility(inputId, iconId) {
            const input = document.getElementById(inputId);
            const icon = document.getElementById(iconId);
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
        
        function resetPassword(userId) {
            const newPassword = document.getElementById('reset-new-password').value;
            const confirmPassword = document.getElementById('reset-confirm-password').value;
            
            if (!newPassword) return alert("Please enter a new password.");
            if (newPassword.length < 6) return alert("Password must be at least 6 characters long.");
            if (newPassword !== confirmPassword) return alert("Passwords do not match!");
            
            const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
            if (userIndex === -1) return alert("User not found.");
            
            db.users[userIndex].password = newPassword;
            saveDB();
            
            alert("✅ Password Reset Successfully!\n\nYou can now login with your new password.");
            closeModal();
        }

        function viewCSCredentials(matchId) {
            const match = db.tournaments.find(t => t.id === matchId);
            if (!match) return alert("Match not found!");
            
            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');
            
            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-key mr-2 text-blue-400"></i>CS Match Credentials</h3>
                
                <div class="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-4">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-blue-400 font-bold">${match.matchType || 'Clash Squad'}</span>
                        <span class="text-xs text-slate-400">Room #${match.id.toString().slice(-4)}</span>
                    </div>
                    <div class="text-xs text-slate-400 mb-3">
                        <p><i class="fas fa-clock mr-1"></i> Time: ${match.time || '-'}</p>
                        <p><i class="fas fa-gem text-blue-400 mr-1"></i> Entry: ${match.fee} stones</p>
                        <p><i class="fas fa-crown text-yellow-400 mr-1"></i> Prize: ${Math.floor(match.fee * 1.6)} stones</p>
                    </div>
                </div>
                
                ${match.roomId && match.roomPassword ? `
                    <div class="bg-green-500/10 border border-green-500/50 p-4 rounded-lg mb-4">
                        <h4 class="text-green-400 font-bold mb-3 text-center"><i class="fas fa-check-circle mr-1"></i> Room Details</h4>
                        
                        <div class="space-y-3">
                            <div class="bg-slate-900 p-3 rounded-lg">
                                <p class="text-xs text-slate-400 mb-1">Match ID</p>
                                <p class="text-xl font-bold text-white text-center">${match.roomId}</p>
                            </div>
                            
                            <div class="bg-slate-900 p-3 rounded-lg">
                                <p class="text-xs text-slate-400 mb-1">Password</p>
                                <p class="text-xl font-bold text-yellow-400 text-center">${match.roomPassword}</p>
                            </div>
                        </div>
                        
                        <p class="text-xs text-slate-400 text-center mt-3"><i class="fas fa-info-circle mr-1"></i>Use these credentials to join the room in Free Fire</p>
                    </div>
                ` : `
                    <div class="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-lg mb-4 text-center">
                        <i class="fas fa-hourglass-half text-4xl text-yellow-400 mb-3"></i>
                        <h4 class="text-yellow-400 font-bold mb-2">Credentials Not Available</h4>
                        <p class="text-xs text-slate-400">The match creator hasn't sent the credentials yet. Please wait.</p>
                    </div>
                `}
                
                <button onclick="closeModal()" class="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-lg font-bold transition">
                    <i class="fas fa-times mr-1"></i> Close
                </button>
            `;
        }

        // --- CS RESULT REPORTING & ADMIN REVIEW ---
        function reportCSResult(matchId, didWin, isCreator) {
            const match = db.tournaments.find(t => t.id === matchId);
            if (!match) return alert("Match not found!");

            if (match.status !== 'Active') {
                return alert("Result can be submitted only when match is Active.");
            }

            // Authorization
            if (isCreator) {
                if (match.userId !== currentUser.id) return alert("Not allowed.");
                if (match.creatorReported) return alert("You already reported.");
            } else {
                if (match.opponentId !== currentUser.id) return alert("Not allowed.");
                if (match.opponentReported) return alert("You already reported.");
            }

            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');

            const resultText = didWin ? 'Won' : 'Lost';
            const prize = Math.floor((match.fee || 0) * 1.6);

            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-3 text-center"><i class="fas fa-flag-checkered text-blue-400 mr-2"></i>Report Result</h3>

                <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 text-xs text-slate-300 mb-4">
                    <p><span class="text-slate-400">Room:</span> #${match.id.toString().slice(-4)} (${match.matchType || 'Clash Squad'})</p>
                    <p><span class="text-slate-400">Selected:</span> <span class="${didWin ? 'text-green-400' : 'text-red-400'} font-bold">${resultText}</span></p>
                    <p><span class="text-slate-400">Entry:</span> ${match.fee} stones ・ <span class="text-slate-400">Prize:</span> <span class="text-green-400 font-bold">${prize}</span></p>
                </div>

                <div class="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg text-xs text-yellow-200 mb-4">
                    <p class="font-bold text-yellow-300 mb-1"><i class="fas fa-exclamation-triangle mr-1"></i>Screenshot Required</p>
                    <p>Upload a match screenshot. Admin will review after both players submit.</p>
                </div>

                <div class="space-y-2 mb-4">
                    <label class="text-xs text-slate-400">Upload Screenshot</label>
                    <input type="file" id="cs-result-file" accept="image/*" class="w-full text-xs bg-slate-900 p-2 rounded border border-slate-700">
                </div>

                <button onclick="submitCSResult(${matchId}, ${didWin ? 'true' : 'false'}, ${isCreator ? 'true' : 'false'})" class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-bold">
                    Submit Result
                </button>
            `;
        }

        function submitCSResult(matchId, didWin, isCreator) {
            const fileInput = document.getElementById('cs-result-file');
            if (!fileInput || !fileInput.files || !fileInput.files[0]) {
                return alert("Please upload screenshot.");
            }

            const idx = db.tournaments.findIndex(t => t.id === matchId);
            if (idx === -1) return alert("Match not found!");

            const match = db.tournaments[idx];

            // Authorization again
            if (isCreator) {
                if (match.userId !== currentUser.id) return alert("Not allowed.");
                if (match.creatorReported) return alert("You already reported.");
            } else {
                if (match.opponentId !== currentUser.id) return alert("Not allowed.");
                if (match.opponentReported) return alert("You already reported.");
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                if (isCreator) {
                    db.tournaments[idx].creatorReported = true;
                    db.tournaments[idx].creatorResult = didWin ? 'Won' : 'Lost';
                    db.tournaments[idx].creatorScreenshot = e.target.result;
                } else {
                    db.tournaments[idx].opponentReported = true;
                    db.tournaments[idx].opponentResult = didWin ? 'Won' : 'Lost';
                    db.tournaments[idx].opponentScreenshot = e.target.result;
                }

                // When both report -> send to admin
                if (db.tournaments[idx].creatorReported && db.tournaments[idx].opponentReported) {
                    db.tournaments[idx].status = 'Pending Review';
                    db.tournaments[idx].pendingAdminReview = true;
                    db.tournaments[idx].pendingReviewAt = new Date().toISOString();
                }

                saveDB();
                closeModal();

                alert("✅ Result submitted successfully.");
                renderCS();
                renderProfile();
            };
            reader.onerror = function() {
                alert("Error reading screenshot. Please try again.");
            };
            reader.readAsDataURL(fileInput.files[0]);
        }

        function openCSManageModal() {
            if (!currentUser || (currentUser.email !== ADMIN_EMAIL && currentUser.role !== 'admin')) {
                return alert('Admin only.');
            }

            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');

            const pending = db.tournaments
                .filter(t => t.type === 'CS' && t.pendingAdminReview === true)
                .sort((a, b) => (b.pendingReviewAt || b.date || '').localeCompare(a.pendingReviewAt || a.date || ''));

            const recent = db.tournaments
                .filter(t => t.type === 'CS' && (t.status === 'Completed' || t.status === 'Rejected'))
                .slice(-10)
                .reverse();

            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-crosshairs mr-2 text-blue-400"></i>CS Manage</h3>

                <div class="mb-4">
                    <h4 class="text-sm font-bold text-yellow-400 mb-2"><i class="fas fa-clock mr-2"></i>Pending Review (${pending.length})</h4>

                    ${pending.length === 0 ? `
                        <div class="bg-slate-900/40 border border-slate-700 rounded-lg p-4 text-center text-sm text-slate-500">
                            No pending CS matches.
                        </div>
                    ` : `
                        <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            ${pending.map(m => {
                                const creatorName = m.username || (db.users.find(u => u.id === m.userId)?.username) || 'Creator';
                                const opponentName = m.opponentUsername || (db.users.find(u => u.id === m.opponentId)?.username) || 'Opponent';
                                const prize = Math.floor((m.fee || 0) * 1.6);
                                const cRes = m.creatorResult || '-';
                                const oRes = m.opponentResult || '-';
                                return `
                                    <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                        <div class="flex justify-between items-start mb-2">
                                            <div>
                                                <p class="font-bold text-white">${m.matchType || 'Clash Squad'} <span class="text-slate-500 font-normal">#${m.id.toString().slice(-4)}</span></p>
                                                <p class="text-xs text-slate-400">Entry: ${m.fee} stones ・ Prize: <span class="text-green-400 font-bold">${prize}</span></p>
                                                <p class="text-xs text-slate-500">${m.pendingReviewAt ? new Date(m.pendingReviewAt).toLocaleString() : ''}</p>
                                            </div>
                                            <span class="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded">Pending Review</span>
                                        </div>

                                        <div class="grid grid-cols-2 gap-2 mb-3">
                                            <div class="bg-slate-800 p-2 rounded border border-slate-700">
                                                <p class="text-[10px] text-slate-400 mb-1">Creator: <span class="text-white font-bold">${creatorName}</span></p>
                                                <p class="text-xs ${cRes === 'Won' ? 'text-green-400' : cRes === 'Lost' ? 'text-red-400' : 'text-slate-400'} font-bold mb-2">${cRes}</p>
                                                ${m.creatorScreenshot ? `
                                                    <img src="${m.creatorScreenshot}" class="w-full h-24 object-cover rounded border border-slate-600 cursor-pointer" onclick="viewCSProof(${m.id}, 'creator')">
                                                ` : `<p class="text-[10px] text-slate-500">No screenshot</p>`}
                                            </div>

                                            <div class="bg-slate-800 p-2 rounded border border-slate-700">
                                                <p class="text-[10px] text-slate-400 mb-1">Opponent: <span class="text-white font-bold">${opponentName}</span></p>
                                                <p class="text-xs ${oRes === 'Won' ? 'text-green-400' : oRes === 'Lost' ? 'text-red-400' : 'text-slate-400'} font-bold mb-2">${oRes}</p>
                                                ${m.opponentScreenshot ? `
                                                    <img src="${m.opponentScreenshot}" class="w-full h-24 object-cover rounded border border-slate-600 cursor-pointer" onclick="viewCSProof(${m.id}, 'opponent')">
                                                ` : `<p class="text-[10px] text-slate-500">No screenshot</p>`}
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-2 gap-2">
                                            <button onclick="approveCSMatch(${m.id}, 'creator')" class="bg-green-600 hover:bg-green-700 text-white py-2 rounded text-xs font-bold transition">
                                                <i class="fas fa-trophy mr-1"></i> Creator Won
                                            </button>
                                            <button onclick="approveCSMatch(${m.id}, 'opponent')" class="bg-green-600 hover:bg-green-700 text-white py-2 rounded text-xs font-bold transition">
                                                <i class="fas fa-trophy mr-1"></i> Opponent Won
                                            </button>
                                        </div>

                                        <button onclick="rejectCSMatchAdmin(${m.id})" class="w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-xs font-bold transition">
                                            <i class="fas fa-times mr-1"></i> Reject & Refund
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <div class="border-t border-slate-700 pt-4">
                    <h4 class="text-sm font-bold text-slate-400 mb-2"><i class="fas fa-history mr-2"></i>Recent Decisions</h4>
                    ${recent.length === 0 ? `
                        <p class="text-xs text-slate-500 text-center">No history yet</p>
                    ` : `
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            ${recent.map(m => `
                                <div class="bg-slate-900/50 p-2 rounded text-xs flex justify-between items-center">
                                    <span class="text-slate-300">${m.matchType || 'CS'} #${m.id.toString().slice(-4)}</span>
                                    <span class="${m.status === 'Completed' ? 'text-green-400' : 'text-red-400'} font-bold">${m.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        }

        function approveCSMatch(matchId, winnerSide) {
            const idx = db.tournaments.findIndex(t => t.id === matchId);
            if (idx === -1) return alert("Match not found!");

            const m = db.tournaments[idx];
            if (m.type !== 'CS') return alert("Invalid match.");
            if (!m.pendingAdminReview) return alert("This match is not pending review.");

            const prize = Math.floor((m.fee || 0) * 1.6);
            const winnerId = winnerSide === 'creator' ? m.userId : m.opponentId;
            if (!winnerId) return alert("Winner not found.");

            const winnerUserIdx = db.users.findIndex(u => u.id === winnerId);
            if (winnerUserIdx !== -1) {
                const winner = db.users[winnerUserIdx];
                if (winner.email === ADMIN_EMAIL || winner.role === 'admin') {
                    winner.stones = 999999;
                } else {
                    winner.stones = (winner.stones || 0) + prize;
                }
                db.users[winnerUserIdx] = winner;
            }

            db.transactions.push({
                id: Date.now(),
                userId: winnerId,
                type: 'credit',
                amount: prize,
                description: `CS Match Prize (#${m.id.toString().slice(-4)})`,
                date: new Date().toISOString(),
                approvedBy: currentUser.username
            });

            db.tournaments[idx].status = 'Completed';
            db.tournaments[idx].pendingAdminReview = false;
            db.tournaments[idx].winnerId = winnerId;
            db.tournaments[idx].winnerSide = winnerSide;
            db.tournaments[idx].completedAt = new Date().toISOString();

            saveDB();
            alert(`✅ Approved! Prize ${prize} stones sent.`);
            openCSManageModal();
            renderCS();
            renderProfile();
        }

        function rejectCSMatchAdmin(matchId) {
            const idx = db.tournaments.findIndex(t => t.id === matchId);
            if (idx === -1) return alert("Match not found!");

            const m = db.tournaments[idx];
            if (!m.pendingAdminReview) return alert("This match is not pending review.");

            const reason = prompt("Reject this match and refund both players? Enter reason (optional):");
            if (reason === null) return;

            const fee = parseInt(m.fee || 0);

            // Refund creator
            refundUserStones(m.userId, fee, `CS Refund (#${m.id.toString().slice(-4)})`);

            // Refund opponent
            if (m.opponentId) refundUserStones(m.opponentId, fee, `CS Refund (#${m.id.toString().slice(-4)})`);

            db.tournaments[idx].status = 'Rejected';
            db.tournaments[idx].pendingAdminReview = false;
            db.tournaments[idx].rejectionReason = reason || 'Rejected by admin';
            db.tournaments[idx].completedAt = new Date().toISOString();

            saveDB();
            alert("❌ Match rejected and refunded.");
            openCSManageModal();
            renderCS();
            renderProfile();
        }

        function refundUserStones(userId, amount, description) {
            if (!userId || !amount) return;
            const userIdx = db.users.findIndex(u => u.id === userId);
            if (userIdx === -1) return;

            const user = db.users[userIdx];
            if (user.email === ADMIN_EMAIL || user.role === 'admin') {
                user.stones = 999999;
            } else {
                user.stones = (user.stones || 0) + amount;
            }
            db.users[userIdx] = user;

            db.transactions.push({
                id: Date.now(),
                userId: userId,
                type: 'credit',
                amount: amount,
                description: description,
                date: new Date().toISOString(),
                approvedBy: currentUser?.username || 'system'
            });
        }

        function viewCSProof(matchId, side) {
            const m = db.tournaments.find(t => t.id === matchId);
            if (!m) return;

            const img = side === 'creator' ? m.creatorScreenshot : m.opponentScreenshot;
            if (!img) return;

            const overlay = document.createElement('div');
            overlay.id = 'cs-proof-overlay';
            overlay.className = 'fixed inset-0 bg-black/95 z-[120] flex items-center justify-center p-4';
            overlay.innerHTML = `
                <div class="relative w-full max-w-lg">
                    <button onclick="closeCSProof()" class="absolute -top-10 right-0 text-white text-xl hover:text-red-400 transition">
                        <i class="fas fa-times"></i> Close
                    </button>
                    <img src="${img}" class="w-full rounded-lg shadow-2xl">
                </div>
            `;
            document.body.appendChild(overlay);
        }

        // --- STORE MANAGE (ADMIN) ---
        function openStoreManageModal() {
            if (!currentUser || (currentUser.email !== ADMIN_EMAIL && currentUser.role !== 'admin')) {
                return alert('Admin only.');
            }

            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');

            const pendingOrders = db.orders.filter(o => o.status === 'Pending');
            const processedOrders = db.orders.filter(o => o.status !== 'Pending').slice(-10).reverse();

            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-store mr-2 text-amber-400"></i>Store Manage</h3>

                <div class="mb-4">
                    <h4 class="text-sm font-bold text-yellow-400 mb-2 flex items-center">
                        <i class="fas fa-clock mr-2"></i>Pending Orders (${pendingOrders.length})
                    </h4>
                    ${pendingOrders.length === 0 ? `
                        <p class="text-slate-500 text-sm text-center py-4">No pending store orders</p>
                    ` : `
                        <div class="space-y-3 max-h-[60vh] overflow-y-auto">
                            ${pendingOrders.map(o => `
                                <div class="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <p class="font-bold text-white text-sm">${escapeHtml(o.item)}</p>
                                            <p class="text-xs text-slate-400">User: ${escapeHtml(o.username || '')}</p>
                                            <p class="text-xs text-slate-400">UID: <span class="text-blue-400 font-semibold">${escapeHtml(o.uid || 'Not set')}</span></p>
                                            <p class="text-[11px] text-slate-500">${new Date(o.date).toLocaleString()}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-lg font-bold text-yellow-400">${o.price}</p>
                                            <p class="text-xs text-slate-400">Stones</p>
                                        </div>
                                    </div>

                                    <div class="flex gap-2">
                                        <button onclick="approveStoreOrder(${o.id})" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold transition">
                                            <i class="fas fa-check mr-1"></i> Complete
                                        </button>
                                        <button onclick="rejectStoreOrder(${o.id})" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs font-bold transition">
                                            <i class="fas fa-times mr-1"></i> Reject & Refund
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <div class="border-t border-slate-700 pt-4">
                    <h4 class="text-sm font-bold text-slate-400 mb-2 flex items-center">
                        <i class="fas fa-history mr-2"></i>Recent Store History
                    </h4>
                    ${processedOrders.length === 0 ? `
                        <p class="text-slate-500 text-xs text-center py-2">No history yet</p>
                    ` : `
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            ${processedOrders.map(o => `
                                <div class="bg-slate-900/50 p-2 rounded text-xs flex justify-between items-center">
                                    <div>
                                        <span class="text-white mr-1">${escapeHtml(o.username || '')}</span>
                                        <span class="text-slate-400">${escapeHtml(o.item)}</span>
                                        <span class="text-slate-500 ml-1">(${o.price} stones)</span>
                                    </div>
                                    <span class="${o.status === 'Completed' ? 'text-green-400' : 'text-red-400'}">${o.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        }

        function approveStoreOrder(orderId) {
            const idx = db.orders.findIndex(o => o.id === orderId);
            if (idx === -1) return alert('Order not found.');

            const order = db.orders[idx];
            if (!confirm(`Mark order as Completed?\n\nUser: ${order.username}\nItem: ${order.item}\nPrice: ${order.price} stones\nUID: ${order.uid || 'Not set'}`)) return;

            db.orders[idx].status = 'Completed';
            db.orders[idx].processedAt = new Date().toISOString();
            db.orders[idx].processedBy = currentUser.username;

            saveDB();
            alert('✅ Order marked as Completed.');
            openStoreManageModal();
        }

        function rejectStoreOrder(orderId) {
            const idx = db.orders.findIndex(o => o.id === orderId);
            if (idx === -1) return alert('Order not found.');

            const order = db.orders[idx];
            const reason = prompt(`Reject and refund this order?\n\nUser: ${order.username}\nItem: ${order.item}\nPrice: ${order.price} stones\nUID: ${order.uid || 'Not set'}\n\nEnter reason (optional):`);
            if (reason === null) return;

            // Refund stones to user
            const userIdx = db.users.findIndex(u => u.id === order.userId);
            if (userIdx !== -1) {
                const user = db.users[userIdx];
                if (user.email === ADMIN_EMAIL || user.role === 'admin') {
                    user.stones = 999999;
                } else {
                    user.stones = (user.stones || 0) + (order.price || 0);
                }
                db.users[userIdx] = user;

                db.transactions.push({
                    id: Date.now(),
                    userId: order.userId,
                    type: 'credit',
                    amount: order.price,
                    description: 'Store order refund: ' + (reason || 'Rejected by admin'),
                    date: new Date().toISOString(),
                    approvedBy: currentUser.username
                });
            }

            db.orders[idx].status = 'Rejected';
            db.orders[idx].rejectionReason = reason || 'Rejected by admin';
            db.orders[idx].processedAt = new Date().toISOString();
            db.orders[idx].processedBy = currentUser.username;

            saveDB();
            alert('❌ Order rejected and stones refunded.');
            openStoreManageModal();
        }

        function closeCSProof() {
            const overlay = document.getElementById('cs-proof-overlay');
            if (overlay) overlay.remove();
        }

        // --- MANAGE STORE ITEMS (ADMIN) ---
        function openManageStoreItemsModal() {
            if (!currentUser || (currentUser.email !== ADMIN_EMAIL && currentUser.role !== 'admin')) {
                return alert('Admin only.');
            }

            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');

            // Initialize store items in db if not exists
            if (!db.storeItems) {
                db.storeItems = {
                    diamonds: [
                        { id: 1, name: '25 Diamonds', diamonds: 25, price: 30 },
                        { id: 2, name: '50 Diamonds', diamonds: 50, price: 55 },
                        { id: 3, name: '115 Diamonds', diamonds: 115, price: 100 },
                        { id: 4, name: '240 Diamonds', diamonds: 240, price: 200 },
                        { id: 5, name: '610 Diamonds', diamonds: 610, price: 500 },
                        { id: 6, name: '1240 Diamonds', diamonds: 1240, price: 1000 },
                        { id: 7, name: '2530 Diamonds', diamonds: 2530, price: 2000 }
                    ],
                    others: [
                        { id: 101, name: 'Weekly Mem.', price: 200 },
                        { id: 102, name: 'Level-up Pass', price: 200 },
                        { id: 103, name: 'Monthly Mem.', price: 1030 },
                        { id: 104, name: 'Evo (3 Days)', price: 110 },
                        { id: 105, name: 'Evo (7 Days)', price: 210 },
                        { id: 106, name: 'Evo (30 Days)', price: 420 }
                    ]
                };
                saveDB();
            }

            const diamonds = db.storeItems.diamonds || [];
            const others = db.storeItems.others || [];

            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-boxes mr-2 text-amber-400"></i>Manage Store Items</h3>

                <!-- Add New Item Form -->
                <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 mb-4">
                    <h4 class="text-sm font-bold text-green-400 mb-2"><i class="fas fa-plus-circle mr-1"></i>Add New Item</h4>
                    <div class="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label class="text-[10px] text-slate-400">Item Type</label>
                            <select id="new-item-type" class="w-full bg-slate-800 p-2 rounded border border-slate-600 text-white text-xs">
                                <option value="diamonds">💎 Diamonds</option>
                                <option value="others">⭐ Special Item</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400">Price (Stones)</label>
                            <input type="number" id="new-item-price" class="w-full bg-slate-800 p-2 rounded border border-slate-600 text-white text-xs" placeholder="e.g. 100">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label class="text-[10px] text-slate-400">Item Name</label>
                            <input type="text" id="new-item-name" class="w-full bg-slate-800 p-2 rounded border border-slate-600 text-white text-xs" placeholder="e.g. Weekly Mem.">
                        </div>
                        <div id="diamonds-amount-field">
                            <label class="text-[10px] text-slate-400">Diamonds Amount</label>
                            <input type="number" id="new-item-diamonds" class="w-full bg-slate-800 p-2 rounded border border-slate-600 text-white text-xs" placeholder="e.g. 100">
                        </div>
                    </div>
                    <button onclick="addStoreItem()" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-xs font-bold transition">
                        <i class="fas fa-plus mr-1"></i> Add Item
                    </button>
                </div>

                <!-- Diamonds Items -->
                <div class="mb-4">
                    <h4 class="text-sm font-bold text-blue-400 mb-2"><i class="fas fa-gem mr-1"></i>Diamonds (${diamonds.length})</h4>
                    <div class="space-y-2 max-h-32 overflow-y-auto">
                        ${diamonds.length === 0 ? `
                            <p class="text-slate-500 text-xs text-center py-2">No diamond items</p>
                        ` : diamonds.map(item => `
                            <div class="bg-slate-900 p-2 rounded flex justify-between items-center">
                                <div>
                                    <span class="text-white text-sm">${item.diamonds} 💎</span>
                                    <span class="text-yellow-400 text-xs ml-2">${item.price} Stones</span>
                                </div>
                                <button onclick="removeStoreItem('diamonds', ${item.id})" class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[10px]">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Special Items -->
                <div class="mb-4">
                    <h4 class="text-sm font-bold text-purple-400 mb-2"><i class="fas fa-star mr-1"></i>Special Items (${others.length})</h4>
                    <div class="space-y-2 max-h-32 overflow-y-auto">
                        ${others.length === 0 ? `
                            <p class="text-slate-500 text-xs text-center py-2">No special items</p>
                        ` : others.map(item => `
                            <div class="bg-slate-900 p-2 rounded flex justify-between items-center">
                                <div>
                                    <span class="text-white text-sm">${escapeHtml(item.name)}</span>
                                    <span class="text-yellow-400 text-xs ml-2">${item.price} Stones</span>
                                </div>
                                <button onclick="removeStoreItem('others', ${item.id})" class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[10px]">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button onclick="closeModal()" class="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold transition text-sm">
                    <i class="fas fa-times mr-1"></i> Close
                </button>
            `;

            // Toggle diamonds amount field based on item type
            document.getElementById('new-item-type').addEventListener('change', function() {
                const diamondsField = document.getElementById('diamonds-amount-field');
                if (this.value === 'diamonds') {
                    diamondsField.style.display = 'block';
                } else {
                    diamondsField.style.display = 'none';
                }
            });
        }

        function addStoreItem() {
            const type = document.getElementById('new-item-type').value;
            const name = document.getElementById('new-item-name').value.trim();
            const price = parseInt(document.getElementById('new-item-price').value);
            const diamonds = parseInt(document.getElementById('new-item-diamonds')?.value) || 0;

            if (!name) return alert('Please enter item name.');
            if (!price || price <= 0) return alert('Please enter valid price.');
            if (type === 'diamonds' && (!diamonds || diamonds <= 0)) return alert('Please enter diamonds amount.');

            const newItem = {
                id: Date.now(),
                name: name,
                price: price
            };

            if (type === 'diamonds') {
                newItem.diamonds = diamonds;
                db.storeItems.diamonds.push(newItem);
            } else {
                db.storeItems.others.push(newItem);
            }

            saveDB();
            alert(`✅ Added: ${name} for ${price} stones`);
            openManageStoreItemsModal(); // Refresh modal
        }

        function removeStoreItem(type, itemId) {
            const item = db.storeItems[type].find(i => i.id === itemId);
            if (!item) return alert('Item not found.');

            if (!confirm(`Remove "${item.name || item.diamonds + ' Diamonds'}" from store?`)) return;

            db.storeItems[type] = db.storeItems[type].filter(i => i.id !== itemId);
            saveDB();
            alert('✅ Item removed from store.');
            openManageStoreItemsModal(); // Refresh modal
        }

        // --- EDIT RULES (ADMIN) ---
        function openEditRulesModal() {
            if (!currentUser || (currentUser.email !== ADMIN_EMAIL && currentUser.role !== 'admin')) {
                return alert('Admin only.');
            }

            const modal = document.getElementById('modal-body');
            document.getElementById('modal-overlay').classList.remove('hidden');

            // Initialize rules in db if not exists
            if (!db.rules) {
                db.rules = {
                    general: [
                        'Minimum Level: 30',
                        'No Hackers: Instant Ban & No Refund.',
                        'Banned Weapons: Grenade, Double Vector, Mag-7.',
                        'Fine for breaking rules: 10 NPR.'
                    ],
                    reporting: [
                        'CS Match: Winner/Loser MUST select result.',
                        'Screenshot required for CS & Lone Wolf wins.',
                        'Wrong remark in payment = No Refund.'
                    ],
                    saturdaySpecial: 'Free tournament every Saturday'
                };
                saveDB();
            }

            const rules = db.rules;

            modal.innerHTML = `
                <h3 class="text-xl font-bold mb-4 text-center"><i class="fas fa-gavel mr-2 text-red-400"></i>Edit App Rules</h3>

                <!-- General Rules -->
                <div class="mb-4">
                    <label class="text-sm font-bold text-red-400 mb-2 block"><i class="fas fa-exclamation-triangle mr-1"></i>General Rules</label>
                    <textarea id="edit-general-rules" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-xs h-28" placeholder="One rule per line...">${rules.general.join('\n')}</textarea>
                    <p class="text-[10px] text-slate-500 mt-1">Enter each rule on a new line</p>
                </div>

                <!-- Reporting Rules -->
                <div class="mb-4">
                    <label class="text-sm font-bold text-blue-400 mb-2 block"><i class="fas fa-flag mr-1"></i>Reporting Rules</label>
                    <textarea id="edit-reporting-rules" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-xs h-24" placeholder="One rule per line...">${rules.reporting.join('\n')}</textarea>
                    <p class="text-[10px] text-slate-500 mt-1">Enter each rule on a new line</p>
                </div>

                <!-- Saturday Special -->
                <div class="mb-4">
                    <label class="text-sm font-bold text-yellow-400 mb-2 block"><i class="fas fa-star mr-1"></i>Saturday Special</label>
                    <input type="text" id="edit-saturday-special" class="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white text-sm" value="${escapeHtml(rules.saturdaySpecial)}">
                </div>

                <div class="flex gap-2">
                    <button onclick="saveRules()" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition text-sm">
                        <i class="fas fa-save mr-1"></i> Save Rules
                    </button>
                    <button onclick="closeModal()" class="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold transition text-sm">
                        <i class="fas fa-times mr-1"></i> Cancel
                    </button>
                </div>
            `;
        }

        function saveRules() {
            const generalRulesText = document.getElementById('edit-general-rules').value.trim();
            const reportingRulesText = document.getElementById('edit-reporting-rules').value.trim();
            const saturdaySpecial = document.getElementById('edit-saturday-special').value.trim();

            // Parse rules from text (split by newline)
            const generalRules = generalRulesText.split('\n').filter(r => r.trim() !== '');
            const reportingRules = reportingRulesText.split('\n').filter(r => r.trim() !== '');

            db.rules = {
                general: generalRules,
                reporting: reportingRules,
                saturdaySpecial: saturdaySpecial || 'Free tournament every Saturday'
            };

            saveDB();
            alert('✅ Rules saved successfully!');
            closeModal();
            
            // Refresh Rules page if currently viewing it
            const activeNav = document.querySelector('.nav-btn.text-blue-500');
            if (activeNav && activeNav.dataset.target === 'rules') {
                renderRules();
            }
        }
