# Premium Features Usage Examples

## How to Gate Premium Features

### Method 1: Using PremiumGate Component

Wrap your premium feature with the `PremiumGate` component:

```javascript
import { PremiumGate } from '../components/PremiumGate';

function BudgetScreen({ navigation }) {
  return (
    <PremiumGate 
      featureName="Budget Management" 
      navigation={navigation}
    >
      {/* Your premium feature content here */}
      <View>
        <Text>Budget Management Feature</Text>
        {/* ... rest of your feature */}
      </View>
    </PremiumGate>
  );
}
```

### Method 2: Using usePremium Hook

Check premium status and conditionally render:

```javascript
import { usePremium } from '../components/PremiumGate';
import { useAppStore } from '../store/useAppStore';

function AdvancedReportScreen({ navigation }) {
  const { isPremium, requirePremium } = usePremium();
  
  // Option 1: Redirect to Premium screen
  useEffect(() => {
    if (!isPremium) {
      requirePremium('Advanced Reports', navigation);
    }
  }, [isPremium, navigation]);
  
  if (!isPremium) {
    return null; // or show upgrade prompt
  }
  
  return (
    <View>
      {/* Your premium feature */}
    </View>
  );
}
```

### Method 3: Conditional Rendering

```javascript
import { useAppStore } from '../store/useAppStore';

function SettingsScreen({ navigation }) {
  const { isPremium } = useAppStore();
  
  return (
    <View>
      {isPremium ? (
        <List.Item
          title="Cloud Backup"
          description="Sync your data across devices"
          onPress={() => navigation.navigate('CloudBackup')}
        />
      ) : (
        <List.Item
          title="Cloud Backup"
          description="Premium feature - Upgrade to unlock"
          onPress={() => navigation.navigate('Premium')}
          left={props => <List.Icon {...props} icon="crown" />}
        />
      )}
    </View>
  );
}
```

## Example: Gating a Feature in Reports Screen

```javascript
import { PremiumGate } from '../components/PremiumGate';

function ReportsListScreen({ navigation }) {
  return (
    <ScrollView>
      {/* Free reports */}
      <ReportCard title="Monthly Summary" />
      <ReportCard title="Category Analysis" />
      
      {/* Premium report */}
      <PremiumGate 
        featureName="Year-over-Year Comparison" 
        navigation={navigation}
      >
        <ReportCard 
          title="Year-over-Year Comparison"
          onPress={() => navigation.navigate('YearOverYearReport')}
        />
      </PremiumGate>
    </ScrollView>
  );
}
```

## Example: Gating Budget Feature

```javascript
import { PremiumGate, usePremium } from '../components/PremiumGate';

function DashboardScreen({ navigation }) {
  const { isPremium } = usePremium();
  
  return (
    <View>
      {/* Free features */}
      <IncomeExpenseCard />
      <RecentTransactionsCard />
      
      {/* Premium feature */}
      {isPremium ? (
        <BudgetCard />
      ) : (
        <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
          <Card>
            <Card.Content>
              <Icon source="crown" />
              <Text>Upgrade to unlock Budget Management</Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

## Example: Gating Export Feature

```javascript
import { useAppStore } from '../store/useAppStore';

function ExportScreen({ navigation }) {
  const { isPremium } = useAppStore();
  
  const handleExportPDF = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'PDF export is available in Premium. Upgrade to unlock.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => navigation.navigate('Premium') 
          },
        ]
      );
      return;
    }
    
    // Export PDF logic
    exportToPDF();
  };
  
  return (
    <View>
      <Button onPress={handleExportPDF}>
        Export as PDF {!isPremium && '(Premium)'}
      </Button>
    </View>
  );
}
```

## Best Practices

1. **Always show what's premium**: Don't hide premium features completely. Show them with an upgrade prompt.

2. **Be clear about value**: Explain what users get with premium.

3. **Allow free trial**: Consider offering a free trial period.

4. **Graceful degradation**: If a feature has free and premium parts, show the free parts and gate only premium parts.

5. **Check status on mount**: Always check premium status when component mounts, as it may have changed.

6. **Handle subscription expiry**: The system automatically checks subscription status, but you may want to show a message when subscription expires.

