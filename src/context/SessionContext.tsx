import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
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

    useEffect(() => {
        const checkSessionStatus = async () => {
            try {
                const sessionRef = collection(database, 'Session');
                const q = query(sessionRef, where('status', '==', 'open'));
                const querySnapshot = await getDocs(q);
                let openFound = false;
                let endTimestamp: Date | null = null;
                let sessionEventName: string | null = null;

                querySnapshot.forEach((doc) => {
                    const session = doc.data() as Session;
                    if (session.status === 'open') {
                        openFound = true;
                        endTimestamp = new Date(session.end.seconds * 1000); // Convert Firebase Timestamp to Date
                        sessionEventName = session.event; // Capture the event name
                    }
                });

                setIsOpen(openFound);
                setEndTime(endTimestamp);
                setEventName(sessionEventName);
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

    return (
        <SessionContext.Provider value={{ isOpen, loading, endTime, eventName }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);
