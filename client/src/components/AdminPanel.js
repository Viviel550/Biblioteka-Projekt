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
    const token = localStorage.getItem('token');
    const [workers, setWorkers] = useState([]); // State to store workers


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
                window.location.href = '/login';
                return;
            }

            if (decodedToken.rola !== 'Administrator') {
                navigate('/login');
                return;
            }

            if (activeTab === 'profile') {
                fetch('http://localhost:3000/admin/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then((res) => res.json())
                    .then((data) => setProfile(data));
            }
            if (activeTab === 'logs') {
                // Fetch workers list for filter dropdown
                fetch('http://localhost:3000/admin/workers', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (!data.error) {
                            setWorkersList(data);
                        }
                    })
                    .catch((err) => console.error('Error fetching workers for filter:', err));

                // Fetch logs
                fetchLogs();
            }
            
            if (activeTab === 'users') {
                fetch('http://localhost:3000/admin/users', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then((res) => res.json())
                    .then((data) => {
                      setUsers(data);
                      setAllUsers(data);
                    })
                    .catch((err) => console.error('Error fetching users:', err));

            }
            if (activeTab === 'addworker') {
                fetch('http://localhost:3000/admin/jobs', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (!data.error) {
                            setJobs(data); // Set job data
                        } else {
                            console.error('Error fetching jobs:', data.error);
                        }
                    })
                    .catch((err) => console.error('Error fetching jobs:', err));
            }

            if (activeTab === 'delworker') {
                fetch('http://localhost:3000/admin/workers', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        console.log("Data: ", data);
                        if (!data.error) {
                            setWorkers(data); // Set workers data
                        } else {
                            console.error('Error fetching workers:', data.error);
                        }
                    })
                    .catch((err) => console.error('Error fetching workers:', err));
            }
        } catch (err) {
            console.error('Invalid token:', err);
            navigate('/login');
        }
    }, [navigate, activeTab, token]);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

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
    const updateEmail = () => {
        fetch('http://localhost:3000/admin/email', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email }),
        })
            .then(res => res.json())
            .then(data => alert(data.message || data.error));
    };

    const updatePassword = () => {
      if (newPassword !== confirmPassword) {
          alert("Nowe hasła się nie zgadzają.");
          return;
      }
  
      fetch('http://localhost:3000/admin/password', {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
              old_password: oldPassword,
              new_password: newPassword,
          }),
      })
          .then(res => res.json())
          .then(data => alert(data.message || data.error));
    };

    const handleDeleteUser = (userId) => {
        if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
            fetch(`http://localhost:3000/admin/deactivate-user/${userId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    alert(data.message || data.error);
                    if (!data.error) {
                        setUsers(users.filter((user) => user.id !== userId));
                    }
                })
                .catch((err) => console.error('Error deleting user:', err));
        }
    };
    const deactivateWorker = (workerId) => {
        if (window.confirm('Czy na pewno chcesz dezaktywować tego pracownika?')) {
            fetch(`http://localhost:3000/admin/deactivate-worker/${workerId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    alert(data.message || data.error);
                    if (!data.error) {
                        setWorkers(                        
                            workers.map((worker) =>
                            worker.id === workerId ? { ...worker, status: false } : worker
                            )
                        ); 
                    }
                })
                .catch((err) => console.error('Error deactivating worker:', err));
        }
    };
    const reactivateWorker = (workerId) => {
        if (window.confirm('Czy na pewno chcesz reaktywować tego pracownika?')) {
            fetch(`http://localhost:3000/admin/reactivate-worker/${workerId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    alert(data.message || data.error);
                    if (!data.error) {
                        // Update the worker's status in the frontend
                        setWorkers(
                            workers.map((worker) =>
                                worker.id === workerId ? { ...worker, status: true } : worker
                            )
                        );
                    }
                })
                .catch((err) => console.error('Error reactivating worker:', err));
        }
    };

    const addWorker = (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const surname = e.target.surname.value;
        const email = e.target.email.value;
        const position = e.target.position.value;

        fetch('http://localhost:3000/admin/createworker', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name, surname, email, position }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) {
                    setModalData({ userId: data.user_id, password: data.password }); // Set modal data
                    e.target.reset(); // Clear the form after successful submission
                }
                else {
                    alert(data.error);
                }
            })
            .catch((err) => console.error('Error adding worker:', err));
    };

    const closeModal = () => {
        setModalData(null); // Close the modal
    };

    return (
        <div className="worker-panel">
            <div className="sidebar">
                <h2>Panel Główny</h2>
                <button onClick={() => setActiveTab('profile')}>Profil</button>
                <button onClick={() => setActiveTab('edit')}>Edycja danych</button>
                <button onClick={() => setActiveTab('addworker')}>Dodanie Pracownika</button>
                <button onClick={() => setActiveTab('delworker')}>Zarządzanie Pracownikami</button>
                <button onClick={() => setActiveTab('users')}>Usunięcie Użytkownika</button>
                <button onClick={() => setActiveTab('logs')}>Logi</button>
                <button onClick={handleLogout}>Wyloguj</button>
            </div>
            <div className="content">
                {activeTab === 'profile' && profile && (
                    <div className="profile">
                        <div className="avatar">[Zdjęcie]</div>
                        <div>
                            <p><strong>ID:</strong> {profile.id}</p>
                            <p><strong>Imię i nazwisko:</strong> {profile.first_name} {profile.last_name}</p>
                            <p><strong>Email:</strong> {profile.email}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'edit' && (
                    <div className="edit-section">
                        <h3>Zmień email</h3>
                        <input
                            type="email"
                            placeholder="Nowy email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button onClick={updateEmail}>Zmień email</button>

                        <h3>Zmień hasło</h3>
                        <input
                            type="password"
                            placeholder="Obecne hasło"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Nowe hasło"
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

                {activeTab === 'users' && (
                  <div className="user-management">
                      <h3>Lista użytkowników</h3>
                      <input
                          type="text"
                          placeholder="Szukaj użytkownika"
                          onChange={(e) => {
                              const searchValue = e.target.value.toLowerCase();
                              setUsers(
                                  allUsers.filter((user) =>
                                      user.name.toLowerCase().includes(searchValue)
                                  )
                              );
                          }}
                          style={{
                              marginBottom: '10px',
                              padding: '5px',
                              width: '100%',
                              boxSizing: 'border-box',
                          }}
                      />
                      <table className="user-table">
                          <thead>
                              <tr>
                                  <th>ID</th>
                                  <th>Imię i nazwisko</th>
                                  <th>Data utworzenia</th>
                                  <th>Akcja</th>
                              </tr>
                          </thead>
                          <tbody>
                              {users.map((user) => (
                                  <tr key={user.id}>
                                      <td>{user.id}</td>
                                      <td>{user.name}</td>
                                      <td>{user.created_at}</td>
                                      <td>
                                          <button
                                              onClick={() => {
                                                  if (
                                                      window.confirm(
                                                          'Czy na pewno chcesz usunąć tego użytkownika?'
                                                      )
                                                  ) {
                                                      handleDeleteUser(user.id);
                                                      alert(
                                                          'Użytkownik został pomyślnie usunięty.'
                                                      );
                                                  }
                                              }}
                                          >
                                              Usuń
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}

                {activeTab === 'addworker' && (
                    <div className="add-user">
                        <h3>Dodaj Pracownika</h3>
                        <form onSubmit={addWorker}>
                            <input type="text" name="name" placeholder="Imię" required />
                            <input type="text" name="surname" placeholder="Nazwisko" required />
                            <input type="email" name="email" placeholder="Email" required />
                            <select name="position" required>
                                <option value="">Wybierz stanowisko</option>
                                {jobs.map((job) => (
                                    <option key={job.id} value={job.id}>
                                        {job.name}
                                    </option>
                                ))}
                            </select>
                            <button type="submit">Dodaj</button>
                        </form>
                    </div>
                )}

                {modalData && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>Pracownik został dodany!</h3>
                            <p><strong>ID:</strong> {modalData.userId}</p>
                            <p><strong>Hasło:</strong> {modalData.password}</p>
                            <button onClick={closeModal}>Zamknij</button>
                        </div>
                    </div>
                )}
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
                {activeTab === 'delworker' && (
                    <div className="delete-worker">
                        <h3>Dezaktywuj Pracownika</h3>
                        <table className="worker-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Imię</th>
                                    <th>Nazwisko</th>
                                    <th>Stanowisko</th>
                                    <th>Status</th>
                                    <th>Akcja</th>
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
                                            {worker.status === true
                                                ? 'Aktywny'
                                                : worker.status === false
                                                ? 'Nieaktywny'
                                                : 'Nowe'}
                                        </td>
                                        <td>
                                            {worker.status === true || worker.status === null ? (
                                                <button onClick={() => deactivateWorker(worker.id)}>
                                                    Dezaktywuj
                                                </button>
                                            ) : (
                                                <button onClick={() => reactivateWorker(worker.id)}> Reaktywuj</button>
                                            )}

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

    );
}

export default WorkerPanel;
