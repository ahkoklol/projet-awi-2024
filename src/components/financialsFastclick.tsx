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
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchFinancialStatements = async () => {
            try {
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
                    };
                });

                setFinancialStatementsSellers(statements);

                // Calculate Fastclick values based on sellers' data
                const commissions_collected = statements.reduce((sum, statement) => sum + statement.commission_paid, 0);
                const deposited_fees_collected = statements.reduce((sum, statement) => sum + statement.deposit_fees_paid, 0);
                const games_remaining = statements.reduce((sum, statement) => sum + statement.games_remaining, 0);
                const games_sold = statements.reduce((sum, statement) => sum + statement.games_sold, 0);
                const total_due = statements.reduce((sum, statement) => sum + statement.total_due, 0);
                const total_earnings = statements.reduce((sum, statement) => sum + statement.total_earnings, 0);

                // Assuming 'cash' is a fixed or computed value
                const cash = total_due * 0.1; // Example: 10% of total_due, you can replace with actual logic

                // Calculate net profit
                const net_profit = total_earnings - total_due;

                // Set the calculated financial statement for Fastclick
                const financialStatement = {
                    commissions_collected,
                    deposited_fees_collected,
                    games_remaining,
                    games_sold,
                    total_due,
                    total_earnings,
                    cash,
                    net_profit,
                };

                setFinancialStatementFastclick(financialStatement);

                // Post the calculated financial statement to Firestore
                await setDoc(doc(database, 'FinancialStatementFastclick', 'fastclickData'), financialStatement, { merge: true });

                setLoading(false); // Set loading to false when data is fetched and posted
                console.log(financialStatementsSellers);
            } catch (error) {
                console.error('Error fetching financial statements:', error);
                setLoading(false);
            }
        };

        fetchFinancialStatements();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!financialStatementFastclick) {
        return (
            <Typography variant="h6" color="error">
                No financial data available.
            </Typography>
        );
    }

    return (
        <Box p={2}>
            <Typography variant="h4" gutterBottom>
                Financial Statement Fastclick
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
        </Box>
    );
};

export default FinancialStatementFastclick;
