import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/AdminPanel.css';

function WorkerPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterWorker, setFilterWorker] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [workersList, setWorkersList] = useState([]);
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [modalData, setModalData] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [usersCurrentPage, setUsersCurrentPage] = useState(1);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [usersPerPage] = useState(5); // Users per page
    const [totalUsersCount, setTotalUsersCount] = useState(0);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp < currentTime) {
                localStorage.clear();
                showNotification('Sesja wygasła. Zaloguj się ponownie.', 'error');
                window.location.href = '/login';
                return;
            }

            if (decodedToken.rola !== 'Administrator') {
                navigate('/login');
                return;
            }

            fetchTabData();
        } catch (err) {
            console.error('Invalid token:', err);
            showNotification('Nieprawidłowy token. Zaloguj się ponownie.', 'error');
            navigate('/login');
        }
    }, [navigate, activeTab, token]);

    const fetchTabData = async () => {
        setLoading(true);
        
        try {
            if (activeTab === 'profile') {
                const res = await fetch('http://localhost:3000/admin/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setProfile(data);
            }
            
            if (activeTab === 'logs') {
                // Fetch workers list for filter dropdown
                const workersRes = await fetch('http://localhost:3000/admin/workers', {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const workersData = await workersRes.json();
                if (!workersData.error) {
                    setWorkersList(workersData);
                }

                // Fetch logs
                fetchLogs();
            }
            
            if (activeTab === 'users') {
                // Fetch users with pagination
                const usersParams = new URLSearchParams({
                    page: usersCurrentPage,
                    limit: usersPerPage,
                    ...(searchTerm && { search: searchTerm })
                });

                const res = await fetch(`http://localhost:3000/admin/users?${usersParams}`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                
                if (!data.error) {
                    setUsers(data.users || data); // Handle different response formats
                    setTotalUsersCount(data.total || data.length);
                    setUsersTotalPages(Math.ceil((data.total || data.length) / usersPerPage));
                    
                    // If no search term, set allUsers for filtering
                    if (!searchTerm) {
                        setAllUsers(data.users || data);
                    }
                } else {
                    console.error('Error fetching users:', data.error);
                    setUsers([]);
                }
            }

            if (activeTab === 'addworker') {
                const res = await fetch('http://localhost:3000/admin/jobs', {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!data.error) {
                    setJobs(data);
                } else {
                    console.error('Error fetching jobs:', data.error);
                }
            }

            if (activeTab === 'delworker') {
                const res = await fetch('http://localhost:3000/admin/workers', {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!data.error) {
                    setWorkers(data);
                } else {
                    console.error('Error fetching workers:', data.error);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showNotification('Błąd podczas pobierania danych', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        // Tworzymy elegancką notyfikację w stylu Max
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✓' : '⚠'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Dodajemy style dla notyfikacji
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    min-width: 300px;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s;
                    animation-fill-mode: forwards;
                }
                .notification-success {
                    background: linear-gradient(135deg, rgba(46, 160, 67, 0.9), rgba(40, 167, 69, 0.9));
                    border: 1px solid rgba(46, 160, 67, 0.3);
                }
                .notification-error {
                    background: linear-gradient(135deg, rgba(220, 53, 69, 0.9), rgba(176, 42, 55, 0.9));
                    border: 1px solid rgba(220, 53, 69, 0.3);
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: white;
                    font-weight: 500;
                }
                .notification-icon {
                    font-size: 1.2rem;
                    font-weight: bold;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    };

    const handleLogout = () => {
        if (window.confirm('Czy na pewno chcesz się wylogować?')) {
            localStorage.clear();
            showNotification('Zostałeś wylogowany', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }
    };

    // PRESERVED LOGS FUNCTIONS
    const fetchLogs = () => {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20,
            ...(filterWorker && { worker: filterWorker }),
            ...(filterAction && { action: filterAction })
        });

        fetch(`http://localhost:3000/admin/logs?${params}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) {
                    setLogs(data.logs);
                    setTotalPages(Math.ceil(data.total / 20));
                } else {
                    console.error('Error fetching logs:', data.error);
                }
            })
            .catch((err) => console.error('Error fetching logs:', err));
    };

    const handleFilterChange = () => {
        setCurrentPage(1); // Reset to first page when filtering
        fetchLogs();
    };

    const clearFilters = () => {
        setFilterWorker('');
        setFilterAction('');
        setCurrentPage(1);
    };

    const updateEmail = async () => {
        if (!email.trim()) {
            showNotification('Wprowadź nowy adres email', 'error');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/admin/email', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            
            if (data.error) {
                showNotification(data.error, 'error');
            } else {
                showNotification(data.message || 'Email został zaktualizowany', 'success');
                setEmail('');
                fetchTabData(); // Odśwież dane profilu
            }
        } catch (error) {
            showNotification('Błąd podczas aktualizacji email', 'error');
        }
    };

    const updatePassword = async () => {
        if (!oldPassword.trim() || !newPassword.trim()) {
            showNotification('Wypełnij wszystkie pola hasła', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('Nowe hasła się nie zgadzają', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showNotification('Nowe hasło musi mieć co najmniej 6 znaków', 'error');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/admin/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                }),
            });
            const data = await res.json();
            
            if (data.error) {
                showNotification(data.error, 'error');
            } else {
                showNotification(data.message || 'Hasło zostało zmienione', 'success');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            showNotification('Błąd podczas zmiany hasła', 'error');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika? Ta akcja jest nieodwracalna.')) {
            try {
                const res = await fetch(`http://localhost:3000/admin/deactivate-user/${userId}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                
                if (data.error) {
                    showNotification(data.error, 'error');
                } else {
                    showNotification(data.message || 'Użytkownik został usunięty', 'success');
                    // Refresh current page instead of filtering arrays
                    fetchTabData();
                }
            } catch (error) {
                showNotification('Błąd podczas usuwania użytkownika', 'error');
            }
        }
    };

    const deactivateWorker = async (workerId) => {
        if (window.confirm('Czy na pewno chcesz dezaktywować tego pracownika?')) {
            try {
                const res = await fetch(`http://localhost:3000/admin/deactivate-worker/${workerId}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                
                if (data.error) {
                    showNotification(data.error, 'error');
                } else {
                    showNotification(data.message || 'Pracownik został dezaktywowany', 'success');
                    setWorkers(workers.map((worker) =>
                        worker.id === workerId ? { ...worker, status: false } : worker
                    ));
                }
            } catch (error) {
                showNotification('Błąd podczas dezaktywacji pracownika', 'error');
            }
        }
    };

    const reactivateWorker = async (workerId) => {
        if (window.confirm('Czy na pewno chcesz reaktywować tego pracownika?')) {
            try {
                const res = await fetch(`http://localhost:3000/admin/reactivate-worker/${workerId}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                
                if (data.error) {
                    showNotification(data.error, 'error');
                } else {
                    showNotification(data.message || 'Pracownik został reaktywowany', 'success');
                    setWorkers(workers.map((worker) =>
                        worker.id === workerId ? { ...worker, status: true } : worker
                    ));
                }
            } catch (error) {
                showNotification('Błąd podczas reaktywacji pracownika', 'error');
            }
        }
    };

    const addWorker = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const surname = formData.get('surname');
        const email = formData.get('email');
        const position = formData.get('position');

        if (!name || !surname || !email || !position) {
            showNotification('Wypełnij wszystkie pola', 'error');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/admin/createworker', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, surname, email, position }),
            });
            const data = await res.json();
            
            if (data.error) {
                showNotification(data.error, 'error');
            } else {
                setModalData({ userId: data.user_id, password: data.password });
                e.target.reset();
                showNotification('Pracownik został dodany pomyślnie', 'success');
            }
        } catch (error) {
            showNotification('Błąd podczas dodawania pracownika', 'error');
        }
    };

    const closeModal = () => {
        setModalData(null);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
        setUsersCurrentPage(1); // Reset to first page when searching
        
        if (!searchValue.trim()) {
            // If search is empty, reload all users
            fetchTabData();
            return;
        }
        
        // Filter locally or fetch from server with search
        const filtered = allUsers.filter((user) =>
            user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchValue.toLowerCase())
        );
        setUsers(filtered);
        setUsersTotalPages(Math.ceil(filtered.length / usersPerPage));
    };

    const renderLoadingSpinner = () => (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Ładowanie danych...</p>
        </div>
    );
    const handleUsersPageChange = (newPage) => {
        setUsersCurrentPage(newPage);
        // Trigger data fetch for new page
        setTimeout(() => {
            fetchTabData();
        }, 0);
    };
    return (
        <div className="worker-panel">
            <div className="sidebar">
                <h2>Panel Administratora</h2>
                <button 
                    className={activeTab === 'profile' ? 'active' : ''}
                    onClick={() => setActiveTab('profile')}
                >
                    👤 Profil
                </button>
                <button 
                    className={activeTab === 'edit' ? 'active' : ''}
                    onClick={() => setActiveTab('edit')}
                >
                    ⚙️ Edycja danych
                </button>
                <button 
                    className={activeTab === 'addworker' ? 'active' : ''}
                    onClick={() => setActiveTab('addworker')}
                >
                    ➕ Dodaj Pracownika
                </button>
                <button 
                    className={activeTab === 'delworker' ? 'active' : ''}
                    onClick={() => setActiveTab('delworker')}
                >
                    👥 Zarządzaj Pracownikami
                </button>
                <button 
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                >
                    🗑️ Zarządzaj Użytkownikami
                </button>
                <button 
                    className={activeTab === 'logs' ? 'active' : ''}
                    onClick={() => setActiveTab('logs')}
                >
                    📊 Logi
                </button>
                <button onClick={handleLogout} className="logout-btn">
                    🚪 Wyloguj
                </button>
            </div>
            
            <div className="content">
                {loading && renderLoadingSpinner()}
                
                {!loading && activeTab === 'profile' && profile && (
                    <div className="profile">
                        <div className="avatar">
                            {profile.first_name?.[0]}{profile.last_name?.[0]}
                        </div>
                        <div>
                            <p><strong>ID:</strong> {profile.id}</p>
                            <p><strong>Imię i nazwisko:</strong> {profile.first_name} {profile.last_name}</p>
                            <p><strong>Email:</strong> {profile.email}</p>
                            <p><strong>Rola:</strong> Administrator</p>
                        </div>
                    </div>
                )}

                {!loading && activeTab === 'edit' && (
                    <div className="edit-section">
                        <h3>🔧 Zmień email</h3>
                        <input
                            type="email"
                            placeholder="Wprowadź nowy email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button onClick={updateEmail}>Zaktualizuj email</button>

                        <h3>🔒 Zmień hasło</h3>
                        <input
                            type="password"
                            placeholder="Obecne hasło"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Nowe hasło (min. 6 znaków)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Powtórz nowe hasło"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button onClick={updatePassword}>Zmień hasło</button>
                    </div>
                )}

                {!loading && activeTab === 'users' && (
                    <div className="user-management">
                        <h3>👥 Zarządzanie użytkownikami</h3>
                        
                        {/* Search and Stats Bar */}
                        <div className="users-header">
                            <input
                                type="text"
                                placeholder="🔍 Szukaj użytkownika po imieniu lub emailu..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="users-search"
                            />
                            <div className="users-stats">
                                <span className="total-count">
                                    📊 Łącznie użytkowników: <strong>{totalUsersCount}</strong>
                                </span>
                                <span className="page-info">
                                    Strona {usersCurrentPage} z {usersTotalPages}
                                </span>
                            </div>
                        </div>
                        
                        {users.length === 0 ? (
                            <div className="no-results">
                                <p>{searchTerm ? 'Nie znaleziono użytkowników pasujących do wyszukiwania' : 'Brak użytkowników'}</p>
                            </div>
                        ) : (
                            <>
                                <div className="table-container">
                                    <table className="user-table compact">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nazwa Użytkownika</th>
                                                <th>Data utworzenia</th>
                                                <th>Akcje</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="id-cell">{user.id}</td>
                                                    <td className="name-cell">{user.name}</td>
                                                    
                                                    <td className="date-cell">
                                                        {new Date(user.created_at).toLocaleDateString('pl-PL', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="action-cell">
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="delete-btn compact"
                                                            title="Usuń użytkownika"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Users Pagination */}
                                {usersTotalPages > 1 && (
                                    <div className="users-pagination">
                                        <button 
                                            onClick={() => handleUsersPageChange(1)}
                                            disabled={usersCurrentPage === 1}
                                            className="pagination-btn first"
                                            title="Pierwsza strona"
                                        >
                                            ⏮️
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleUsersPageChange(usersCurrentPage - 1)}
                                            disabled={usersCurrentPage === 1}
                                            className="pagination-btn prev"
                                            title="Poprzednia strona"
                                        >
                                            ⬅️
                                        </button>
                                        
                                        <div className="page-numbers">
                                            {Array.from({ length: Math.min(5, usersTotalPages) }, (_, i) => {
                                                let pageNum;
                                                if (usersTotalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (usersCurrentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (usersCurrentPage >= usersTotalPages - 2) {
                                                    pageNum = usersTotalPages - 4 + i;
                                                } else {
                                                    pageNum = usersCurrentPage - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handleUsersPageChange(pageNum)}
                                                        className={`pagination-btn number ${usersCurrentPage === pageNum ? 'active' : ''}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleUsersPageChange(usersCurrentPage + 1)}
                                            disabled={usersCurrentPage === usersTotalPages}
                                            className="pagination-btn next"
                                            title="Następna strona"
                                        >
                                            ➡️
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleUsersPageChange(usersTotalPages)}
                                            disabled={usersCurrentPage === usersTotalPages}
                                            className="pagination-btn last"
                                            title="Ostatnia strona"
                                        >
                                            ⏭️
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {!loading && activeTab === 'addworker' && (
                    <div className="add-user">
                        <h3>➕ Dodaj nowego pracownika</h3>
                        <form onSubmit={addWorker}>
                            <input type="text" name="name" placeholder="Imię" required />
                            <input type="text" name="surname" placeholder="Nazwisko" required />
                            <input type="email" name="email" placeholder="Adres email" required />
                            <select name="position" required>
                                <option value="">Wybierz stanowisko</option>
                                {jobs.map((job) => (
                                    <option key={job.id} value={job.id}>
                                        {job.name}
                                    </option>
                                ))}
                            </select>
                            <button type="submit">Dodaj pracownika</button>
                        </form>
                    </div>
                )}

                {!loading && activeTab === 'delworker' && (
                    <div className="delete-worker">
                        <h3>👥 Zarządzanie pracownikami</h3>
                        {workers.length === 0 ? (
                            <div className="no-results">
                                <p>Brak pracowników do wyświetlenia</p>
                            </div>
                        ) : (
                            <table className="worker-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Imię</th>
                                        <th>Nazwisko</th>
                                        <th>Stanowisko</th>
                                        <th>Status</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workers.map((worker) => (
                                        <tr key={worker.id}>
                                            <td>{worker.id}</td>
                                            <td>{worker.name}</td>
                                            <td>{worker.surname}</td>
                                            <td>{worker.job}</td>
                                            <td>
                                                <span className={`status status-${
                                                    worker.status === true ? 'active' : 
                                                    worker.status === false ? 'inactive' : 'new'
                                                }`}>
                                                    {worker.status === true ? '✅ Aktywny' : 
                                                     worker.status === false ? '❌ Nieaktywny' : '🆕 Nowy'}
                                                </span>
                                            </td>
                                            <td>
                                                {worker.status === true || worker.status === null ? (
                                                    <button 
                                                        onClick={() => deactivateWorker(worker.id)}
                                                        className="deactivate-btn"
                                                    >
                                                        ⏸️ Dezaktywuj
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => reactivateWorker(worker.id)}
                                                        className="reactivate-btn"
                                                    >
                                                        ▶️ Reaktywuj
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* PRESERVED LOGS SECTION - EXACT ORIGINAL CODE */}
                {activeTab === 'logs' && (
                    <div className="logs-section">
                        <h3>Logi systemowe</h3>
                        
                        {/* Filters */}
                        <div className="filters">
                            <div className="filter-group">
                                <label>Filtruj po pracowniku:</label>
                                <select 
                                    value={filterWorker} 
                                    onChange={(e) => setFilterWorker(e.target.value)}
                                >
                                    <option value="">Wszyscy pracownicy</option>
                                    {workersList.map((worker) => (
                                        <option key={worker.id} value={worker.id}>
                                            {worker.name} {worker.surname}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="filter-group">
                                <label>Filtruj po akcji:</label>
                                <select 
                                    value={filterAction} 
                                    onChange={(e) => setFilterAction(e.target.value)}
                                >
                                    <option value="">Wszystkie akcje</option>
                                    <option value="REACTIVATE_WORKER">REACTIVATE_WORKER</option>
                                    <option value="DEACTIVATE_WORKER">DEACTIVATE_WORKER</option>
                                    <option value="CREATE_WORKER">CREATE_WORKER</option>
                                    <option value="DELETE_USER">DELETE_USER</option>
                                    <option value="DELETE_OPINION">DELETE_OPINION</option>
                                </select>
                            </div>
                            
                            <div className="filter-buttons">
                                <button onClick={handleFilterChange}>Zastosuj filtry</button>
                                <button onClick={clearFilters}>Wyczyść filtry</button>
                            </div>
                        </div>

                        {/* Logs Table */}
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Pracownik</th>
                                    <th>Akcja</th>
                                    <th>Szczegóły</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.log_id}>
                                        <td>{log.log_id}</td>
                                        <td>{log.employee_name || 'N/A'}</td>
                                        <td>{log.action}</td>
                                        <td>
                                            <details>
                                                <summary>Zobacz szczegóły</summary>
                                                <pre>{JSON.stringify(log.action_data, null, 2)}</pre>
                                            </details>
                                        </td>
                                        <td>{new Date(log.action_time).toLocaleString('pl-PL')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="pagination">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Poprzednia
                            </button>
                            
                            <span>Strona {currentPage} z {totalPages}</span>
                            
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Następna
                            </button>
                        </div>
                    </div>
                )}

                {modalData && (
                    <div className="modal" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>🎉 Pracownik został dodany!</h3>
                            <div className="modal-info">
                                <p><strong>ID użytkownika:</strong> {modalData.userId}</p>
                                <p><strong>Tymczasowe hasło:</strong> 
                                    <span className="password-highlight">{modalData.password}</span>
                                </p>
                                <p className="modal-note">
                                    ⚠️ Przekaż te dane pracownikowi i poproś o zmianę hasła przy pierwszym logowaniu.
                                </p>
                            </div>
                            <button onClick={closeModal}>Zamknij</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkerPanel;