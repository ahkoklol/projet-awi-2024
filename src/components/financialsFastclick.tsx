import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { database } from '../config/firebase';
import { Box, CircularProgress, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface FinancialStatementSellers {
    commission_paid: number;
    deposit_fees_paid: number;
    games_remaining: number;
    games_sold: number;
    seller_id: string;
    total_due: number;
    total_earnings: number;
    session_id?: string; // Include session_id for session-based grouping
}

interface FinancialStatementFastclick {
    commissions_collected: number;
    deposited_fees_collected: number;
    games_remaining: number;
    games_sold: number;
    total_due: number;
    total_earnings: number;
    cash: number;
    net_profit: number;
}

const FinancialStatementFastclick: React.FC = () => {
    const [financialStatementsSellers, setFinancialStatementsSellers] = useState<FinancialStatementSellers[]>([]);
    const [financialStatementFastclick, setFinancialStatementFastclick] = useState<FinancialStatementFastclick | null>(null);
    const [financialStatementsBySession, setFinancialStatementsBySession] = useState<Record<string, FinancialStatementFastclick>>({});
    const [sessionEventsMap, setSessionEventsMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchFinancialStatements = async () => {
            try {

                // Fetch session events
                const sessionSnapshot = await getDocs(collection(database, 'Session'));
                const sessionMap: Record<string, string> = {};
                sessionSnapshot.docs.forEach((doc) => {
                const data = doc.data();
                sessionMap[doc.id] = data.event || 'Unknown Event'; // Map session_id to event name
                });
                setSessionEventsMap(sessionMap);
                
                // Fetch data from 'FinancialStatementSellers' collection in Firestore
                const financialStatementSellersRef = collection(database, 'FinancialStatementSellers');
                const querySnapshotSellers = await getDocs(financialStatementSellersRef);

                // Map through the querySnapshot to get the data
                const statements: FinancialStatementSellers[] = querySnapshotSellers.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        seller_id: doc.id, // Use the document ID as seller_id
                        commission_paid: data.commission_paid,
                        deposit_fees_paid: data.deposit_fees_paid,
                        games_remaining: data.games_remaining,
                        games_sold: data.games_sold,
                        total_due: data.total_due,
                        total_earnings: data.total_earnings,
                        session_id: data.session_id, // Include session_id if present
                    };
                });

                setFinancialStatementsSellers(statements);

                // Calculate Fastclick values for all time
                const allTimeFinancials = calculateFinancialStatement(statements);
                setFinancialStatementFastclick(allTimeFinancials);

                // Group statements by session_id and calculate for each session
                const statementsBySession = groupBySession(statements);
                const sessionFinancials: Record<string, FinancialStatementFastclick> = {};
                Object.keys(statementsBySession).forEach((sessionId) => {
                    sessionFinancials[sessionId] = calculateFinancialStatement(statementsBySession[sessionId]);
                });

                setFinancialStatementsBySession(sessionFinancials);

                // Post the all-time financial statement to Firestore
                await setDoc(doc(database, 'FinancialStatementFastclick', 'fastclickData'), allTimeFinancials, { merge: true });

                setLoading(false); // Set loading to false when data is fetched and processed
            } catch (error) {
                console.error('Error fetching financial statements:', error);
                setLoading(false);
            }
        };

        fetchFinancialStatements();
    }, []);

    // Function to group financial statements by session_id
    const groupBySession = (statements: FinancialStatementSellers[]) => {
        return statements.reduce((acc: Record<string, FinancialStatementSellers[]>, statement) => {
            if (!statement.session_id) return acc; // Skip if no session_id
            if (!acc[statement.session_id]) acc[statement.session_id] = [];
            acc[statement.session_id].push(statement);
            return acc;
        }, {});
    };

    // Function to calculate Fastclick financials
    const calculateFinancialStatement = (statements: FinancialStatementSellers[]): FinancialStatementFastclick => {
        const commissions_collected = statements.reduce((sum, statement) => sum + statement.commission_paid, 0);
        const deposited_fees_collected = statements.reduce((sum, statement) => sum + statement.deposit_fees_paid, 0);
        const games_remaining = statements.reduce((sum, statement) => sum + statement.games_remaining, 0);
        const games_sold = statements.reduce((sum, statement) => sum + statement.games_sold, 0);
        const total_due = statements.reduce((sum, statement) => sum + statement.total_due, 0);
        const total_earnings = statements.reduce((sum, statement) => sum + statement.total_earnings, 0);

        const cash = total_due * 0.1; // Example: 10% of total_due
        const net_profit = total_earnings - total_due;

        return {
            commissions_collected,
            deposited_fees_collected,
            games_remaining,
            games_sold,
            total_due,
            total_earnings,
            cash,
            net_profit,
        };
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={2}>
            <Typography variant="h4" gutterBottom>
                Financial Statement Fastclick (All Time)
            </Typography>
            {financialStatementFastclick && (
                <TableContainer component={Paper} sx={{ marginBottom: 4 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Commissions Collected</TableCell>
                                <TableCell>Deposited Fees Collected</TableCell>
                                <TableCell>Games Remaining</TableCell>
                                <TableCell>Games Sold</TableCell>
                                <TableCell>Total Due</TableCell>
                                <TableCell>Total Earnings</TableCell>
                                <TableCell>Cash</TableCell>
                                <TableCell>Net Profit</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementFastclick.commissions_collected)}
                                </TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementFastclick.deposited_fees_collected)}
                                </TableCell>
                                <TableCell>{financialStatementFastclick.games_remaining}</TableCell>
                                <TableCell>{financialStatementFastclick.games_sold}</TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementFastclick.total_due)}
                                </TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementFastclick.total_earnings)}
                                </TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementFastclick.cash)}
                                </TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementFastclick.net_profit)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Typography variant="h4" gutterBottom>
                Financial Statement Fastclick (By Session)
            </Typography>
            {Object.keys(financialStatementsBySession).map((sessionId) => (
                <Box key={sessionId} mb={4}>
                    <Typography variant="h6" gutterBottom>
                    Session: {sessionEventsMap[sessionId] || 'Unknown Event'} (ID: {sessionId})
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Commissions Collected</TableCell>
                                    <TableCell>Deposited Fees Collected</TableCell>
                                    <TableCell>Games Remaining</TableCell>
                                    <TableCell>Games Sold</TableCell>
                                    <TableCell>Total Due</TableCell>
                                    <TableCell>Total Earnings</TableCell>
                                    <TableCell>Cash</TableCell>
                                    <TableCell>Net Profit</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementsBySession[sessionId].commissions_collected)}
                                    </TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementsBySession[sessionId].deposited_fees_collected)}
                                    </TableCell>
                                    <TableCell>{financialStatementsBySession[sessionId].games_remaining}</TableCell>
                                    <TableCell>{financialStatementsBySession[sessionId].games_sold}</TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementsBySession[sessionId].total_due)}
                                    </TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementsBySession[sessionId].total_earnings)}
                                    </TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementsBySession[sessionId].cash)}
                                    </TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financialStatementsBySession[sessionId].net_profit)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ))}
        </Box>
    );
};

export default FinancialStatementFastclick;
