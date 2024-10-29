import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { database } from '../config/firebase';

interface Session {
    event: string;
    status: string;
    start: { seconds: number };
    end: { seconds: number };
}

interface SessionContextProps {
    isOpen: boolean | null;
    loading: boolean;
    endTime: Date | null;
    eventName: string | null;
}

const SessionContext = createContext<SessionContextProps>({
    isOpen: null,
    loading: true,
    endTime: null,
    eventName: null
});

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState<boolean | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [eventName, setEventName] = useState<string | null>(null);
    const [sessionDocId, setSessionDocId] = useState<string | null>(null); // Track the session document ID

    useEffect(() => {
        const checkSessionStatus = async () => {
            try {
                const sessionRef = collection(database, 'Session');
                const q = query(sessionRef, where('status', '==', 'open'));
                const querySnapshot = await getDocs(q);
                
                let openFound = false;
                let endTimestamp: Date | null = null;
                let sessionEventName: string | null = null;
                let docId: string | null = null;

                querySnapshot.forEach((docSnapshot) => {
                    const session = docSnapshot.data() as Session;
                    if (session.status === 'open') {
                        openFound = true;
                        endTimestamp = new Date(session.end.seconds * 1000); // Convert Firebase Timestamp to Date
                        sessionEventName = session.event;
                        docId = docSnapshot.id; // Capture the document ID for future updates
                    }
                });

                setIsOpen(openFound);
                setEndTime(endTimestamp);
                setEventName(sessionEventName);
                setSessionDocId(docId);

                // Start an interval to check if the session has ended
                if (openFound && endTimestamp) {
                    const interval = setInterval(() => {
                      const now = new Date();
                      if (endTimestamp && now >= endTimestamp) {  // Null check for endTimestamp
                        closeSession(docId); // Close the session if end time has passed
                        clearInterval(interval); // Clear the interval after closing the session
                        console.log(sessionDocId);
                      }
                    }, 1000); // Check every second
                  
                    return () => clearInterval(interval); // Cleanup on unmount
                  }
            } catch (error) {
                console.error('Error checking session status:', error);
                setIsOpen(null);
                setEndTime(null);
                setEventName(null);
            } finally {
                setLoading(false);
            }
        };

        checkSessionStatus();
    }, []);

    const closeSession = async (sessionId: string | null) => {
        if (!sessionId) return;
        try {
            const sessionDocRef = doc(database, 'Session', sessionId);
            await updateDoc(sessionDocRef, { status: 'closed' });
            setIsOpen(false); // Update state to reflect that no session is open
            setEndTime(null);
            setEventName(null);
        } catch (error) {
            console.error('Error closing session:', error);
        }
    };

    return (
        <SessionContext.Provider value={{ isOpen, loading, endTime, eventName }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);
