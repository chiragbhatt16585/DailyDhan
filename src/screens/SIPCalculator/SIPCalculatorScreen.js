import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Dimensions } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Divider,
  Icon,
} from 'react-native-paper';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { AppHeader } from '../../components/AppHeader';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';

const screenWidth = Dimensions.get('window').width;

const SIPCalculatorScreen = ({ navigation }) => {
  const theme = useTheme();
  const { currency } = useAppStore();
  
  const [monthlyInvestment, setMonthlyInvestment] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [investmentPeriod, setInvestmentPeriod] = useState('');
  const [futureValue, setFutureValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [yearlyData, setYearlyData] = useState([]);

  // Calculate SIP
  useEffect(() => {
    const calculateSIP = () => {
      const monthlyAmount = parseFloat(monthlyInvestment) || 0;
      const annualReturn = parseFloat(expectedReturn) || 0;
      const years = parseFloat(investmentPeriod) || 0;

      if (monthlyAmount > 0 && annualReturn >= 0 && years > 0) {
        // Convert annual return to monthly return using compound formula
        // Monthly Return = {(1 + Annual Return)^1/12} – 1
        const monthlyReturn = annualReturn > 0 
          ? Math.pow(1 + annualReturn / 100, 1/12) - 1
          : 0;
        const months = years * 12;

        // SIP Formula: M = P × {(1 + r)^n - 1} / {r} × (1 + r)
        // Where P = monthly investment, r = monthly return, n = number of months
        let fv = 0;
        
        if (monthlyReturn > 0) {
          // Formula for SIP with returns
          const compoundFactor = Math.pow(1 + monthlyReturn, months);
          fv = monthlyAmount * ((compoundFactor - 1) / monthlyReturn) * (1 + monthlyReturn);
        } else {
          // If return is 0, it's just monthly investment × months
          fv = monthlyAmount * months;
        }

        const invested = monthlyAmount * months;
        const returns = fv - invested;

        setFutureValue(fv);
        setTotalInvested(invested);
        setTotalReturns(returns);

        // Calculate yearly breakdown for chart
        const yearlyBreakdown = [];
        let cumulativeInvested = 0;
        let cumulativeValue = 0;
        
        for (let year = 1; year <= years; year++) {
          const monthsInYear = year * 12;
          const investedInYear = monthlyAmount * monthsInYear;
          
          if (monthlyReturn > 0) {
            const compoundFactor = Math.pow(1 + monthlyReturn, monthsInYear);
            cumulativeValue = monthlyAmount * ((compoundFactor - 1) / monthlyReturn) * (1 + monthlyReturn);
          } else {
            cumulativeValue = investedInYear;
          }
          
          cumulativeInvested = investedInYear;
          
          yearlyBreakdown.push({
            year: year,
            invested: cumulativeInvested,
            value: cumulativeValue,
            returns: cumulativeValue - cumulativeInvested,
          });
        }
        
        setYearlyData(yearlyBreakdown);
      } else {
        setFutureValue(0);
        setTotalInvested(0);
        setTotalReturns(0);
        setYearlyData([]);
      }
    };

    calculateSIP();
  }, [monthlyInvestment, expectedReturn, investmentPeriod]);

  const handleCalculate = () => {
    if (!monthlyInvestment || !expectedReturn || !investmentPeriod) {
      return;
    }
    // Calculation happens automatically via useEffect
  };

  const handleReset = () => {
    setMonthlyInvestment('');
    setExpectedReturn('');
    setInvestmentPeriod('');
    setFutureValue(0);
    setTotalInvested(0);
    setTotalReturns(0);
    setYearlyData([]);
  };

  return (
    <>
      <AppHeader showBack title="SIP Calculator" />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Expandable Info Section */}
            <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <TouchableOpacity
                  onPress={() => setShowInfo(!showInfo)}
                  style={styles.infoHeader}
                  activeOpacity={0.7}
                >
                  <Text variant="titleMedium" style={[styles.infoTitle, styles.infoTitleFlex]}>
                    Learn About SIP Calculator
                  </Text>
                  <Icon
                    source={showInfo ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={theme.colors.primary}
                    style={styles.chevronIcon}
                  />
                </TouchableOpacity>

                {showInfo && (
                  <View style={styles.infoContent}>
                    <View style={styles.infoSection}>
                      <Text variant="titleSmall" style={styles.infoSectionTitle}>
                        What is a SIP Calculator?
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        A SIP Calculator is a simple and quick tool to help investors calculate the potential returns they can get from their mutual fund SIPs. A recent trend shows the increasing popularity of SIPs among millennials and Gen Zs, both as they are much more convenient and allow you to build long-term wealth gradually through disciplined monthly contributions.
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        This SIP plan calculator lets you know the value of your investments based on three things, namely amount, tenure, and expected rate of return. While this SIP plan calculator provides a quick estimate, the actual returns of a mutual fund scheme might vary depending on various factors. The SIP Calculator doesn't take into consideration the expense ratio or the exit load. Still, it can guide you with a rough projection of your corpus and help you compare it with a lump-sum investment.
                      </Text>
                    </View>

                    <Divider style={styles.infoDivider} />

                    <View style={styles.infoSection}>
                      <Text variant="titleSmall" style={styles.infoSectionTitle}>
                        What is SIP?
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        Systematic Investment Plan (SIP) allows you to invest a fixed amount regularly into mutual funds or even stocks, helping you grow your money over time. Imagine that you are saving a fixed amount every month by putting X amount of money in a box. It is surely a disciplined way to save money, but that money just sits there and doesn't actually grow. Hence, you invest money through weekly, quarterly, or monthly Systematic Investment Plans (SIPs).
                      </Text>
                    </View>

                    <Divider style={styles.infoDivider} />

                    <View style={styles.infoSection}>
                      <Text variant="titleSmall" style={styles.infoSectionTitle}>
                        Why do you need SIP?
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        The best part of SIPs is their convenience. You don't have to worry about the timing of the market or remembering to invest. Once set up, your contributions happen automatically. This builds consistency, helps you benefit from rupee cost averaging, and grows your money through the power of compounding.
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        SIPs are flexible, so you can start small and increase your amount as your income rises. If you want to calculate how much your investments can grow with an increase in SIPs amount, try using a Step up SIP calculator online to estimate the potential returns.
                      </Text>
                    </View>

                    <Divider style={styles.infoDivider} />

                    <View style={styles.infoSection}>
                      <Text variant="titleSmall" style={styles.infoSectionTitle}>
                        SIP Calculator Formula
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        To calculate the amount you will receive upon maturity of an SIP, also known as the future value, the following formula is used:
                      </Text>
                      <View style={styles.formulaBox}>
                        <Text style={styles.formulaText}>
                          M = P × {'{'}(1 + r)^n - 1{'}'} / {'{'}'r{'}'} × (1 + r)
                        </Text>
                      </View>
                      <Text variant="bodySmall" style={styles.infoText}>
                        Where:
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        • M is the future value of the SIP{'\n'}
                        • P is the monthly SIP amount{'\n'}
                        • n is the total number of installments you made{'\n'}
                        • r is the periodic rate of interest
                      </Text>
                    </View>

                    <Divider style={styles.infoDivider} />

                    <View style={styles.infoSection}>
                      <Text variant="titleSmall" style={styles.infoSectionTitle}>
                        Example Calculation
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        Say Mr. A wants to invest ₹5,000 per month for 10 years at an annual rate of 12% through SIP investment.
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        First, we calculate the monthly rate of return:
                      </Text>
                      <View style={styles.formulaBox}>
                        <Text style={styles.formulaText}>
                          Monthly Return = {'{'}(1 + Annual Return)^1/12{'}'} – 1{'\n'}
                          r = (1 + 0.12)^1/12 − 1 = 0.0095 or 0.95%
                        </Text>
                      </View>
                      <Text variant="bodySmall" style={styles.infoText}>
                        Now, plugging the values:
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        • P = ₹5,000{'\n'}
                        • r = 0.0095 (0.95%){'\n'}
                        • n = 120 months
                      </Text>
                      <Text variant="bodySmall" style={styles.infoText}>
                        After 10 years, Mr. A's SIP corpus will be around ₹11.2 lakh. Out of this, he has invested ₹6 lakh (₹5,000 × 120), and the remaining ₹5.2 lakh is all compounded returns.
                      </Text>
                      <Text variant="bodySmall" style={[styles.infoText, styles.infoNote]}>
                        Note: The rate of return on SIP is not fixed and might differ with market conditions.
                      </Text>
                    </View>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Input Section */}
            <Card style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Investment Details
                </Text>

                <View style={styles.inputGroup}>
                  <Text variant="labelLarge" style={styles.inputLabel}>
                    Monthly Investment Amount ({currency.symbol})
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={monthlyInvestment}
                    onChangeText={setMonthlyInvestment}
                    placeholder="e.g., 5000"
                    keyboardType="numeric"
                    style={styles.input}
                    left={<TextInput.Icon icon="currency-inr" />}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text variant="labelLarge" style={styles.inputLabel}>
                    Expected Annual Return (%)
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={expectedReturn}
                    onChangeText={setExpectedReturn}
                    placeholder="e.g., 12"
                    keyboardType="numeric"
                    style={styles.input}
                    left={<TextInput.Icon icon="percent" />}
                  />
                  <Text variant="bodySmall" style={styles.inputHint}>
                    Typical returns: 10-15% for equity funds, 7-9% for debt funds
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text variant="labelLarge" style={styles.inputLabel}>
                    Investment Period (Years)
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={investmentPeriod}
                    onChangeText={setInvestmentPeriod}
                    placeholder="e.g., 10"
                    keyboardType="numeric"
                    style={styles.input}
                    left={<TextInput.Icon icon="calendar-clock" />}
                  />
                </View>

                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={handleReset}
                    style={styles.resetButton}
                  >
                    Reset
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Results Section */}
            {(futureValue > 0 || totalInvested > 0) && (
              <Card style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Investment Summary
                  </Text>

                  <View style={styles.resultRow}>
                    <View style={styles.resultItem}>
                      <Text variant="bodyMedium" style={styles.resultLabel}>
                        Total Amount Invested
                      </Text>
                      <Text variant="headlineSmall" style={[styles.resultValue, { color: theme.colors.onSurface }]}>
                        {formatCurrency(totalInvested, currency)}
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.resultRow}>
                    <View style={styles.resultItem}>
                      <Text variant="bodyMedium" style={styles.resultLabel}>
                        Estimated Returns
                      </Text>
                      <Text variant="headlineSmall" style={[styles.resultValue, { color: '#34A853' }]}>
                        {formatCurrency(totalReturns, currency)}
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.resultRow}>
                    <View style={styles.resultItem}>
                      <Text variant="bodyMedium" style={styles.resultLabel}>
                        Maturity Value
                      </Text>
                      <Text variant="headlineLarge" style={[styles.resultValue, styles.maturityValue, { color: theme.colors.primary }]}>
                        {formatCurrency(futureValue, currency)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.returnPercentage}>
                    <Text variant="bodySmall" style={styles.returnPercentageText}>
                      Return on Investment: {totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(2) : 0}%
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Charts Section */}
            {(futureValue > 0 && yearlyData.length > 0) && (
              <>
                {/* Pie Chart - Investment Breakdown */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Investment Breakdown
                    </Text>
                    <View style={styles.chartContainer}>
                      <PieChart
                        data={[
                          {
                            name: 'Invested',
                            amount: totalInvested,
                            color: '#1e4e7c',
                            legendFontColor: theme.dark ? '#FFFFFF' : '#333',
                            legendFontSize: 12,
                          },
                          {
                            name: 'Returns',
                            amount: totalReturns,
                            color: '#34A853',
                            legendFontColor: theme.dark ? '#FFFFFF' : '#333',
                            legendFontSize: 12,
                          },
                        ]}
                        width={screenWidth - 64}
                        height={220}
                        chartConfig={{
                          color: (opacity = 1) => theme.dark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                        }}
                        accessor="amount"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                      />
                    </View>
                  </Card.Content>
                </Card>

                {/* Line Chart - Growth Over Time */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
                  <Card.Content style={styles.chartCardContent}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Growth Over Time
                    </Text>
                    <View style={styles.chartContainer}>
                      <LineChart
                        data={{
                          labels: yearlyData.map(d => String(d.year)),
                          datasets: [
                            {
                              data: yearlyData.map(d => Math.round(d.invested)),
                              color: (opacity = 1) => `rgba(30, 78, 124, ${opacity})`, // Blue for invested
                              strokeWidth: 2,
                            },
                            {
                              data: yearlyData.map(d => Math.round(d.value)),
                              color: (opacity = 1) => `rgba(52, 168, 83, ${opacity})`, // Green for maturity value
                              strokeWidth: 2,
                            },
                          ],
                          legend: ['Total Invested', 'Maturity Value'],
                        }}
                        width={screenWidth - 64}
                        height={320}
                        chartConfig={{
                          backgroundColor: theme.colors.surface,
                          backgroundGradientFrom: theme.colors.surface,
                          backgroundGradientTo: theme.colors.surface,
                          decimalPlaces: 0,
                          color: (opacity = 1) =>
                            theme.dark
                              ? `rgba(255, 255, 255, ${opacity})`
                              : `rgba(0, 0, 0, ${opacity})`,
                          labelColor: (opacity = 1) =>
                            theme.dark
                              ? `rgba(255, 255, 255, ${opacity})`
                              : `rgba(0, 0, 0, ${opacity})`,
                          style: {
                            borderRadius: 16,
                          },
                          propsForDots: {
                            r: '4',
                            strokeWidth: '2',
                            stroke: '#fff',
                          },
                          propsForBackgroundLines: {
                            strokeDasharray: '',
                          },
                        }}
                        bezier
                        style={{
                          marginVertical: 8,
                          borderRadius: 16,
                          paddingRight: 10,
                        }}
                        withInnerLines={true}
                        withOuterLines={true}
                        withVerticalLabels={true}
                        withHorizontalLabels={true}
                        withDots={true}
                        withShadow={false}
                        fromZero={true}
                        segments={yearlyData.length > 10 ? 5 : yearlyData.length}
                        yAxisLabel={currency.symbol}
                        yAxisSuffix=""
                      />
                    </View>
                    <Text variant="bodySmall" style={styles.chartNote}>
                      This chart shows how your investment grows over time. The blue line represents your total investment, and the green line shows the maturity value with returns.
                    </Text>
                  </Card.Content>
                </Card>
              </>
            )}

            {/* Disclaimer */}
            <Card style={[styles.disclaimerCard, { backgroundColor: '#FFF3E0' }]}>
              <Card.Content>
                <Text variant="bodySmall" style={styles.disclaimerText}>
                  <Text style={styles.disclaimerBold}>Disclaimer:</Text> This calculator provides estimates only. Actual returns may vary based on market conditions, fund performance, and other factors. Past performance does not guarantee future results. Please consult with a financial advisor before making investment decisions.
                </Text>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default SIPCalculatorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  content: {
    gap: 16,
  },
  infoCard: {
    marginBottom: 8,
    elevation: 2,
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    lineHeight: 20,
    color: '#666',
  },
  inputCard: {
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    marginBottom: 4,
  },
  inputHint: {
    marginTop: 4,
    color: '#666',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  resetButton: {
    minWidth: 100,
  },
  resultCard: {
    elevation: 2,
    marginTop: 8,
  },
  resultRow: {
    marginVertical: 8,
  },
  resultItem: {
    alignItems: 'center',
  },
  resultLabel: {
    marginBottom: 8,
    color: '#666',
    textAlign: 'center',
  },
  resultValue: {
    fontWeight: '700',
    textAlign: 'center',
  },
  maturityValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  divider: {
    marginVertical: 12,
  },
  returnPercentage: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  returnPercentageText: {
    fontWeight: '600',
    color: '#333',
  },
  disclaimerCard: {
    marginTop: 8,
    elevation: 1,
  },
  disclaimerText: {
    lineHeight: 18,
    color: '#666',
  },
  disclaimerBold: {
    fontWeight: '600',
    color: '#333',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 4,
  },
  infoTitleFlex: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  chevronIcon: {
    marginLeft: 'auto',
  },
  infoContent: {
    marginTop: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoSectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  infoDivider: {
    marginVertical: 12,
  },
  formulaBox: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1e4e7c',
  },
  formulaText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  infoNote: {
    fontStyle: 'italic',
    marginTop: 8,
    color: '#666',
  },
  chartCard: {
    elevation: 2,
    marginTop: 8,
  },
  chartCardContent: {
    paddingBottom: 24,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
    overflow: 'visible',
    paddingBottom: 30,
    marginBottom: 10,
  },
  chartNote: {
    marginTop: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 12,
  },
});

