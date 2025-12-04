import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {
  Button,
  List,
  Portal,
  Modal,
  RadioButton,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getDB } from '../../database';
import { AppHeader } from '../../components/AppHeader';

const ICON_GROUPS = [
  {
    key: 'bills',
    label: 'Bills',
    color: '#F4B400',
    icons: [
      { icon: 'receipt', label: 'Receipt' },
      { icon: 'file-invoice-dollar', label: 'Invoice' },
      { icon: 'file-document', label: 'Document' },
    ],
  },
  {
    key: 'household',
    label: 'Household',
    color: '#34A853',
    icons: [
      { icon: 'home-variant', label: 'Home' },
      { icon: 'sofa', label: 'Sofa' },
      { icon: 'lightbulb-on', label: 'Utilities' },
    ],
  },
  {
    key: 'food',
    label: 'Food & Drink',
    color: '#1A73E8',
    icons: [
      { icon: 'food-fork-drink', label: 'Meal' },
      { icon: 'coffee', label: 'Coffee' },
      { icon: 'beer', label: 'Drinks' },
    ],
  },
  {
    key: 'clothes',
    label: 'Clothes',
    color: '#E91E63',
    icons: [
      { icon: 'tshirt-crew', label: 'T‑shirt' },
      { icon: 'shoe-sneaker', label: 'Shoes' },
      { icon: 'shopping', label: 'Shopping' },
    ],
  },
  {
    key: 'sports',
    label: 'Sports',
    color: '#FB8C00',
    icons: [
      { icon: 'basketball', label: 'Basketball' },
      { icon: 'football', label: 'Football' },
      { icon: 'tennis', label: 'Tennis' },
    ],
  },
  {
    key: 'salary',
    label: 'Salary / Income',
    color: '#34A853',
    icons: [
      { icon: 'cash-multiple', label: 'Cash' },
      { icon: 'bank-transfer', label: 'Bank Transfer' },
      { icon: 'wallet', label: 'Wallet' },
    ],
  },
];

const COLOR_PRESETS = [
  { label: 'Blue', value: '#1A73E8' },
  { label: 'Gold', value: '#F4B400' },
  { label: 'Green', value: '#34A853' },
  { label: 'Pink', value: '#E91E63' },
  { label: 'Orange', value: '#FB8C00' },
  { label: 'Purple', value: '#9C27B0' },
];

const CategoriesScreen = ({ navigation }) => {
  const theme = useTheme();
  const isMountedRef = useRef(true);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#1A73E8');
  const [type, setType] = useState('expense');
  const [items, setItems] = useState([]);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('expense');

  const loadCategories = async () => {
    if (!isMountedRef.current) return;
    
    try {
      const db = await getDB();
      
      // Ensure all categories have colors assigned
      const colorPalette = [
        '#1A73E8', '#F4B400', '#34A853', '#E91E63', '#FB8C00',
        '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B',
        '#4CAF50', '#FF9800', '#3F51B5', '#009688', '#CDDC39',
      ];
      
      const [noColorResult] = await db.executeSql(
        'SELECT id FROM categories WHERE color IS NULL OR color = "" ORDER BY id ASC',
      );
      const noColorRows = [];
      for (let i = 0; i < noColorResult.rows.length; i += 1) {
        noColorRows.push(noColorResult.rows.item(i));
      }
      
      // Assign colors to categories without colors
      for (let i = 0; i < noColorRows.length; i += 1) {
        const category = noColorRows[i];
        const colorIndex = category.id % colorPalette.length;
        await db.executeSql('UPDATE categories SET color = ? WHERE id = ?', [
          colorPalette[colorIndex],
          category.id,
        ]);
      }
      
      // Load all categories
      const [result] = await db.executeSql(
        'SELECT id, name, type, icon, color FROM categories ORDER BY name ASC',
      );
      const rows = [];
      for (let i = 0; i < result.rows.length; i += 1) {
        rows.push(result.rows.item(i));
      }
      
      if (isMountedRef.current) {
      setItems(rows);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load categories', e);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const unsubscribe = navigation.addListener('focus', loadCategories);
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [navigation]);

  // Custom back handler that closes modals before navigating
  const handleBackPress = useCallback(() => {
    if (iconPickerVisible || editingCategory) {
      // Close modals first
      setIconPickerVisible(false);
      setEditingCategory(null);
      // Small delay to ensure modals are fully closed before navigation
      setTimeout(() => {
        if (isMountedRef.current) {
          navigation.goBack();
        }
      }, 100);
    } else {
      navigation.goBack();
    }
  }, [navigation, iconPickerVisible, editingCategory]);

  // Ensure modals are closed when leaving this screen to avoid Android ViewGroup errors
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        // Close all modals before unmounting
        setIconPickerVisible(false);
        setEditingCategory(null);
      };
    }, []),
  );

  const onSave = async () => {
    if (!name.trim()) {
      return;
    }

    try {
      const db = await getDB();
      // Default color palette if user didn't select one
      const colorPalette = [
        '#1A73E8', '#F4B400', '#34A853', '#E91E63', '#FB8C00',
        '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B',
      ];
      
      // If category with same name+type exists, update icon/color instead of inserting duplicate
      const [existing] = await db.executeSql(
        'SELECT id FROM categories WHERE name = ? AND type = ? LIMIT 1',
        [name.trim(), type],
      );
      
      let finalColor = color.trim() || '#1A73E8';
      
      // If no color selected, assign one based on existing categories count
      if (!color.trim()) {
        const [countResult] = await db.executeSql(
          'SELECT COUNT(*) as count FROM categories WHERE type = ?',
          [type],
        );
        const count = countResult.rows.item(0).count;
        finalColor = colorPalette[count % colorPalette.length];
      }
      
      if (existing.rows.length > 0) {
        const id = existing.rows.item(0).id;
        await db.executeSql(
          'UPDATE categories SET icon = ?, color = ? WHERE id = ?',
          [icon.trim() || null, finalColor, id],
        );
      } else {
        await db.executeSql(
          'INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
          [name.trim(), type, icon.trim() || null, finalColor],
        );
      }
      setName('');
      setIcon('');
      setColor('#1A73E8');
      setType('expense');
      loadCategories();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save category', e);
    }
  };

  return (
    <>
      <AppHeader showBack title="Categories" onBackPress={handleBackPress} />
      <View style={styles.container}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          New Category
        </Text>
        <TextInput
          mode="outlined"
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Food, Salary"
          style={styles.input}
        />
        <Button
          mode="outlined"
          onPress={() => setIconPickerVisible(true)}
          style={styles.iconButton}
          icon={icon || 'shape'}
        >
          {icon ? 'Change Icon' : 'Choose Icon'}
        </Button>
        <Text style={styles.label}>Chart Color</Text>
        <View style={styles.colorRow}>
          {COLOR_PRESETS.map(preset => {
            const selected = color.toLowerCase() === preset.value.toLowerCase();
            return (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: preset.value },
                  selected && styles.colorOptionSelected,
                ]}
                onPress={() => setColor(preset.value)}
              />
            );
          })}
        </View>
        <TextInput
          mode="outlined"
          label="Custom Color (hex, optional)"
          value={color}
          onChangeText={setColor}
          placeholder="#1A73E8"
          style={styles.input}
        />

        <Text style={styles.label}>Type</Text>
        <RadioButton.Group value={type} onValueChange={setType}>
          <View style={styles.typeRow}>
            <RadioButton value="expense" />
            <Text style={styles.typeLabel}>Expense</Text>
            <RadioButton value="income" />
            <Text style={styles.typeLabel}>Income</Text>
          </View>
        </RadioButton.Group>

        <Button mode="contained" style={styles.saveButton} onPress={onSave}>
          Save Category
        </Button>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Existing Categories
        </Text>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>No categories yet. Add your first one above.</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => String(item.id)}
            removeClippedSubviews={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            renderItem={({ item }) => (
              <List.Item
                title={item.name}
                description={`${item.type.toUpperCase()}  •  ${item.color || theme.colors.primary}`}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={item.icon || (item.type === 'income' ? 'arrow-down' : 'arrow-up')}
                  />
                )}
                onPress={() => {
                  setEditingCategory(item);
                  setEditName(item.name);
                  setEditType(item.type);
                  setIcon(item.icon || '');
                  setColor(item.color || '#1A73E8');
                }}
                right={props => <List.Icon {...props} icon="pencil" />}
              />
            )}
          />
        )}
      </View>
      <Portal>
        <Modal
          visible={!!editingCategory}
          onDismiss={() => setEditingCategory(null)}
          contentContainerStyle={styles.iconModal}
        >
          <Text variant="titleMedium" style={styles.iconModalTitle}>
            Edit Category
          </Text>
          <TextInput
            mode="outlined"
            label="Name"
            value={editName}
            onChangeText={setEditName}
            style={styles.input}
          />
          <Text style={styles.label}>Type</Text>
          <RadioButton.Group value={editType} onValueChange={setEditType}>
            <View style={styles.typeRow}>
              <RadioButton value="expense" />
              <Text style={styles.typeLabel}>Expense</Text>
              <RadioButton value="income" />
              <Text style={styles.typeLabel}>Income</Text>
            </View>
          </RadioButton.Group>
          <Button
            mode="outlined"
            onPress={() => setIconPickerVisible(true)}
            style={[styles.iconButton, { marginTop: 8 }]}
            icon={icon || 'shape'}
          >
            Change Icon
          </Button>
          <Text style={styles.label}>Chart Color</Text>
          <View style={styles.colorRow}>
            {COLOR_PRESETS.map(preset => {
              const selected = color.toLowerCase() === preset.value.toLowerCase();
              return (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.colorOption,
                    { backgroundColor: preset.value },
                    selected && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(preset.value)}
                />
              );
            })}
          </View>
          <TextInput
            mode="outlined"
            label="Custom Color (hex, optional)"
            value={color}
            onChangeText={setColor}
            placeholder="#1A73E8"
            style={styles.input}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <Button
              mode="contained-tonal"
              onPress={async () => {
                if (!editingCategory || !editName.trim()) {
                  return;
                }
                try {
                  const db = await getDB();
                  await db.executeSql(
                    'UPDATE categories SET name = ?, type = ?, icon = ?, color = ? WHERE id = ?',
                    [editName.trim(), editType, icon.trim(), color.trim(), editingCategory.id],
                  );
                  setEditingCategory(null);
                  loadCategories();
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.warn('Failed to update category', e);
                }
              }}
            >
              Save
            </Button>
            <Button
              mode="text"
              textColor="red"
              onPress={async () => {
                if (!editingCategory) {
                  return;
                }
                try {
                  const db = await getDB();
                  await db.executeSql('DELETE FROM categories WHERE id = ?', [editingCategory.id]);
                  setEditingCategory(null);
                  loadCategories();
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.warn('Failed to delete category', e);
                }
              }}
            >
              Delete
            </Button>
          </View>
        </Modal>
        <Modal
          visible={iconPickerVisible}
          onDismiss={() => setIconPickerVisible(false)}
          contentContainerStyle={styles.iconModal}
        >
          <Text variant="titleMedium" style={styles.iconModalTitle}>
            Choose Icon
          </Text>
          {ICON_GROUPS.map(group => (
            <View key={group.key} style={styles.iconGroup}>
              <Text style={styles.iconGroupLabel}>{group.label}</Text>
              <View style={styles.iconGrid}>
                {group.icons.map(option => {
                  const selected = icon === option.icon;
                  return (
                    <TouchableOpacity
                      key={option.icon}
                      style={[
                        styles.iconOption,
                        selected && styles.iconOptionSelected,
                      ]}
                      onPress={() => {
                        setIcon(option.icon);
                        setColor(group.color);
                        setIconPickerVisible(false);
                      }}
                    >
                      <List.Icon icon={option.icon} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <Button onPress={() => setIconPickerVisible(false)}>Close</Button>
        </Modal>
      </Portal>
    </>
  );
};

export default CategoriesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '600',
  },
  iconButton: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  label: {
    marginTop: 4,
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    marginRight: 16,
  },
  saveButton: {
    marginTop: 12,
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 8,
  },
  iconModal: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    maxHeight: '80%',
  },
  iconModalTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  colorModal: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    maxHeight: '70%',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#00000055',
  },
  iconGroup: {
    marginBottom: 8,
  },
  iconGroupLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  iconOption: {
    width: 52,
    height: 52,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  iconOptionSelected: {
    borderColor: '#1A73E8',
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
});


