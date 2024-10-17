import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc } from 'firebase/firestore';
import { database } from '../config/firebase';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';

interface Transaction {
  id: string;
  seller_id: string;
  buyer_id: string;
  sale_date: { seconds: number }; // Firestore Timestamp
  sale_price: number;
  commission_percentage: number;
  item_id: string;
}

interface GameDetails {
  id: string;
  deposit_fee: number;
  deposit_fee_type: string;
  seller_id: string;
}

interface FinancialStatementSellers {
  commission_paid: number;
  deposit_fees_paid: number;
  games_remaining: number;
  games_sold: number;
  seller_id: string;
  total_due: number;
  total_earnings: number;
  transactions: Transaction[];
}

const FinancialStatementSellers: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gameDetailsMap, setGameDetailsMap] = useState<Record<string, GameDetails[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [financialStatements, setFinancialStatements] = useState<FinancialStatementSellers[]>([]);
  const [dataReady, setDataReady] = useState<boolean>(false); // Flag to indicate when data is ready

  useEffect(() => {
    const fetchTransactionsAndGameDetails = async () => {
      setLoading(true);
      try {
        // Fetch transactions
        const transactionsRef = collection(database, 'Transaction');
        const q = query(transactionsRef);
        const querySnapshot = await getDocs(q);

        const transactionList: Transaction[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Transaction));

        setTransactions(transactionList);

        // Fetch FinancialStatementSellers
        const financialStatementSellersRef = collection(database, 'FinancialStatementSellers');
        const financialStatementSellersSnapshot = await getDocs(financialStatementSellersRef);
        
        const financialStatements: FinancialStatementSellers[] = financialStatementSellersSnapshot.docs.map((doc) => {
          const data = doc.data();
        
          return {
            seller_id: doc.id, // Use the document id for seller_id
            commission_paid: data.commission_paid,
            deposit_fees_paid: data.deposit_fees_paid,
            games_remaining: data.games_remaining,
            games_sold: data.games_sold,
            total_due: data.total_due,
            total_earnings: data.total_earnings,
            transactions: data.transactions || [], 
          } as FinancialStatementSellers;
        });

        setFinancialStatements(financialStatements);
        

        // Fetch game details and group by seller_id
        const gameDetailsRef = collection(database, 'GameDetails');
        const gameDetailsSnapshot = await getDocs(gameDetailsRef);

        const gameDetailsMap: Record<string, GameDetails[]> = {};
        gameDetailsSnapshot.docs.forEach((doc) => {
          const data = doc.data();

          const gameDetail: GameDetails = {
            id: doc.id,
            deposit_fee: data.deposit_fee,
            deposit_fee_type: data.deposit_fee_type,
            seller_id: data.seller_id,
          };

          if (!gameDetailsMap[gameDetail.seller_id]) {
            gameDetailsMap[gameDetail.seller_id] = [];
          }

          gameDetailsMap[gameDetail.seller_id].push(gameDetail);
        });

        setGameDetailsMap(gameDetailsMap);
        setDataReady(true); // Set dataReady to true after data is fetched
      } catch (error) {
        console.error('Error fetching transactions or game details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionsAndGameDetails();
  }, []); // Empty dependency array to ensure this runs only once on mount

  useEffect(() => {
    // Only run this effect when dataReady is true
    if (dataReady) {
      const updateFinancialStatementSellers = async () => {
        const financialStatements = calculateFinancials();

        // Save each financial statement to Firestore
        await Promise.all(financialStatements.map(async (statement) => {
          try {
            const sellerDocRef = doc(database, 'FinancialStatementSellers', statement.seller_id);
            await setDoc(sellerDocRef, statement, { merge: true });
          } catch (error) {
            console.error('Error updating financial statement:', error);
          }
        }));
      };

      updateFinancialStatementSellers();
    }
  }, [dataReady]); // Only re-run when dataReady changes

  // Group transactions by seller_id
  const groupedTransactions = transactions.reduce((acc: Record<string, Transaction[]>, transaction) => {
    if (!acc[transaction.seller_id]) {
      acc[transaction.seller_id] = [];
    }
    acc[transaction.seller_id].push(transaction);
    return acc;
  }, {});

  const calculateFinancials = () => {
    const financialStatements: FinancialStatementSellers[] = [];

    Object.keys(groupedTransactions).forEach((sellerId) => {
      const transactionsForSeller = groupedTransactions[sellerId];

      // Initialize the financial values for each seller
      let totalSales = 0;
      let totalCommission = 0;
      let totalDepositFees = 0;

      transactionsForSeller.forEach((transaction) => {
        const { sale_price, commission_percentage, item_id } = transaction;
        const gameDetails = gameDetailsMap[sellerId]?.find((detail) => detail.id === item_id);

        // Calculate total sales
        totalSales += sale_price;

        // Calculate total commission
        totalCommission += sale_price * (commission_percentage / 100);

        // Calculate total deposit fees
        if (gameDetails) {
          if (gameDetails.deposit_fee_type === 'fixed') {
            totalDepositFees += gameDetails.deposit_fee;
          } else if (gameDetails.deposit_fee_type === 'percentage') {
            totalDepositFees += sale_price * (gameDetails.deposit_fee / 100);
          }
        }
      });

      const totalEarnings = totalSales;
      const totalDue = totalEarnings - totalCommission - totalDepositFees;
      const gamesSold = transactionsForSeller.length;
      const gamesRemaining = getTotalGamesRemaining(sellerId);

      // Build the financial statement for this seller
      financialStatements.push({
        seller_id: sellerId,
        commission_paid: totalCommission,
        deposit_fees_paid: totalDepositFees,
        games_remaining: gamesRemaining,
        games_sold: gamesSold,
        total_due: totalDue,
        total_earnings: totalEarnings,
        transactions: transactionsForSeller,
      });
    });

    return financialStatements;
  };

  const getTotalGamesSold = (sellerId: string) => {
    return groupedTransactions[sellerId]?.length || 0;
  };

  const getTotalGameDetails = (sellerId: string) => {
    return gameDetailsMap[sellerId]?.length || 0;
  };

  const getTotalGamesRemaining = (sellerId: string) => {
    return getTotalGameDetails(sellerId) - getTotalGamesSold(sellerId);
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
        Financial Statement
      </Typography>

      {financialStatements.map((statement) => (
        <Box key={statement.seller_id} mb={4}>
          <Typography variant="h5" gutterBottom>
            Profit & Loss Account for Seller ID: {statement.seller_id}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Games Deposited</TableCell>
                  <TableCell>Games Sold</TableCell>
                  <TableCell>Games Remaining</TableCell>
                  <TableCell>Commissions Paid</TableCell>
                  <TableCell>Deposit Fees Paid</TableCell>
                  <TableCell>Total Earnings</TableCell>
                  <TableCell>Total Due To Seller</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{statement.games_remaining + statement.games_sold}</TableCell>
                  <TableCell>{statement.games_sold}</TableCell>
                  <TableCell>{statement.games_remaining}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(statement.commission_paid)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(statement.deposit_fees_paid)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(statement.total_earnings)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(statement.total_due)}
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

export default FinancialStatementSellers;
