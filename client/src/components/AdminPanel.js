import React, { act, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/AdminPanel.css';

function WorkerPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [modalData, setModalData] = useState(null);
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
        } catch (err) {
            console.error('Invalid token:', err);
            navigate('/login');
        }
    }, [navigate, activeTab, token]);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
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

    const addWorker = (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const surname = e.target.surname.value;
        const email = e.target.email.value;
        const position = e.target.position.value;

        fetch('http://localhost:3000/admin/createuser', {
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
    const workerPositions = (e) => {
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
                <button onClick={() => setActiveTab('delworker')}>Usunięcie Pracownika</button>
                <button onClick={() => setActiveTab('users')}>Usunięcie Użytkownika</button>
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
                {activeTab === 'delworker' && (
                    <div className="delete-user">
                        <h3>Usuń Pracownika</h3>
                        <input type="text" placeholder="ID Pracownika" />
                        <button>Usuń</button>
                    </div>
                )}
            </div>
        </div>

    );
}

export default WorkerPanel;
