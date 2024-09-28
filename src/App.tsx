import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { Auth } from './components/auth';
import { database, auth } from './config/firebase';
import { useState, useEffect } from 'react';
import { getDocs, collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { storage } from './config/firebase';
import { ref, uploadBytes } from 'firebase/storage';

interface Game {
  id: string;
  title: string;
  releaseDate?: string; 
  isStillActive: boolean;
  userId: string;
}

function App() {
  const [gamesList, setGamesList] = useState<Game[]>([]); 
  const [newGameTitle, setNewGameTitle] = useState('');
  const [newReleaseDate, setNewReleaseDate] = useState(0);
  const [isStillActive, setIsStillActive] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState('');
  const [fileUpload, setFileUpload] = useState<File | null>(null);

  const gamesCollectionRef = collection(database, "games");

  useEffect(() => {
    getGamesList();
  }, []);

  // GET request to fetch the games list
  const getGamesList = async () => {
    try {
      const data = await getDocs(gamesCollectionRef);
      const filteredData = data.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Game[];
      setGamesList(filteredData);
      console.log('Documents fetched');
    } catch (error) {
      console.log('Error getting documents', error);
    }
  };

  // POST request to add a new game
  const onSubmitGame = async () => {
    try {
      await addDoc(gamesCollectionRef, { title: newGameTitle, releaseDate: newReleaseDate, isStillActive, userId: auth?.currentUser?.uid });
      getGamesList();
      console.log('Document added, list updated');
    } catch (error) {
      console.log('Error adding document', error);
    }
  };

  // DELETE request to delete a game
  const deleteGame = async (id: string) => {
    try {
      const gameDoc = doc(database, "games", id);
      await deleteDoc(gameDoc);
      getGamesList();
      console.log('Document deleted, list updated');
    } catch (error) {
      console.log('Error deleting document', error);
    }
  };

  // PUT request to update a game
  const updateGame = async (id: string) => {
    try {
      const gameDoc = doc(database, "games", id);
      await updateDoc(gameDoc, { title: updatedTitle });
      getGamesList();
      console.log('Document updated, list updated');
    } catch (error) {
      console.log('Error updating document', error);
    }
  };

  // POST to upload file
  const uploadFile = async () => {
    try {
      if (!fileUpload) {
        console.log('No file selected');
        return;
      }
      const filesFolderRef = ref(storage, `ProjectFiles/${fileUpload.name}`);
      await uploadBytes(filesFolderRef, fileUpload);
      console.log('File uploaded');
    } catch (error) {
      console.log('Error uploading file', error);
    }
  };

  return (
    <div className="App">
      <Auth />
      <div>
        <div>
          <input placeholder="Game title" onChange={(e) => setNewGameTitle(e.target.value)} />
          <input placeholder="Release date" type="number" onChange={(e) => setNewReleaseDate(Number(e.target.value))} />
          <input type="checkbox" checked={isStillActive} onChange={(e) => setIsStillActive(e.target.checked)} />
          <label>Still active</label>
          <button onClick={onSubmitGame}>Add game</button>
        </div>

        {gamesList.map((game) => (
          <div key={game.id}>
            <h1>{game.title}</h1>
            {game.releaseDate && <p>Release date: {game.releaseDate}</p>}
            <button onClick={() => deleteGame(game.id)}>Delete Game</button>
            <input placeholder="new title..." onChange={(e) => setUpdatedTitle(e.target.value)} />
            <button onClick={() => updateGame(game.id)}>Update title</button>
          </div>
        ))}
      </div>
      <div>
        <input 
          type="file" 
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              setFileUpload(files[0]);
            } else {
              setFileUpload(null);
            }
          }} 
        />
        <button onClick={uploadFile}>Upload File</button>
      </div>
    </div>
  );
}

export default App;
