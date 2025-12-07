import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import {
  Button,
  Card,
  List,
  Portal,
  Modal,
  RadioButton,
  Text,
  TextInput,
  useTheme,
  IconButton,
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
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('expense');

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
      setAddCategoryModalVisible(false);
      loadCategories();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save category', e);
    }
  };

  // Filter categories by active tab
  const filteredItems = items.filter(item => item.type === activeTab);
  const expenseCount = items.filter(item => item.type === 'expense').length;
  const incomeCount = items.filter(item => item.type === 'income').length;

  return (
    <>
      <AppHeader showBack title="Categories" onBackPress={handleBackPress} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'expense' && [
                styles.tabActive,
                { backgroundColor: theme.colors.primary },
              ],
            ]}
            onPress={() => setActiveTab('expense')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'expense'
                      ? theme.colors.onPrimary || '#FFFFFF'
                      : theme.colors.onSurface,
                },
              ]}
            >
              Expense {expenseCount > 0 && `(${expenseCount})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'income' && [
                styles.tabActive,
                { backgroundColor: theme.colors.primary },
              ],
            ]}
            onPress={() => setActiveTab('income')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'income'
                      ? theme.colors.onPrimary || '#FFFFFF'
                      : theme.colors.onSurface,
                },
              ]}
            >
              Income {incomeCount > 0 && `(${incomeCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {filteredItems.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
                No {activeTab} categories yet. Tap the + button to add your first one.
              </Text>
            ) : (
              <FlatList
                data={filteredItems}
                keyExtractor={item => String(item.id)}
                removeClippedSubviews={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                ItemSeparatorComponent={() => <View style={styles.listDivider} />}
                renderItem={({ item }) => (
                  <List.Item
                    title={item.name}
                    left={props => (
                      <View style={styles.categoryLeftContainer}>
                        <View
                          style={[
                            styles.colorBar,
                            { backgroundColor: item.color || theme.colors.primary },
                          ]}
                        />
                        <List.Icon
                          {...props}
                          icon={item.icon || (item.type === 'income' ? 'arrow-down' : 'arrow-up')}
                        />
                      </View>
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
          </Card.Content>
        </Card>
      </View>
      
      {/* FAB for adding new category */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          setName('');
          setIcon('');
          setColor('#1A73E8');
          setType('expense');
          setAddCategoryModalVisible(true);
        }}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
      
      {/* Add Category Modal */}
      <Portal>
        <Modal
          visible={addCategoryModalVisible}
          onDismiss={() => setAddCategoryModalVisible(false)}
          contentContainerStyle={[
            styles.editModal,
            {
              backgroundColor: theme.dark ? '#1E1E1E' : theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              variant="titleMedium"
              style={[styles.modalHeaderTitle, { color: theme.colors.onSurface }]}
            >
              Add Category
            </Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={() => setAddCategoryModalVisible(false)}
              style={styles.closeButton}
            />
          </View>
          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
          >
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
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>
              Chart Color
            </Text>
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
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>
              Type
            </Text>
            <RadioButton.Group value={type} onValueChange={setType}>
              <View style={styles.typeRow}>
                <RadioButton value="expense" />
                <Text style={[styles.typeLabel, { color: theme.colors.onSurface }]}>
                  Expense
                </Text>
                <RadioButton value="income" />
                <Text style={[styles.typeLabel, { color: theme.colors.onSurface }]}>
                  Income
                </Text>
              </View>
            </RadioButton.Group>
            <View style={styles.modalActions}>
              <Button
                mode="contained"
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary || '#FFFFFF'}
                onPress={onSave}
                style={styles.saveButton}
              >
                Save Category
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
      
      {/* Edit Category Modal */}
      <Portal>
        <Modal
          visible={!!editingCategory}
          onDismiss={() => setEditingCategory(null)}
          contentContainerStyle={[
            styles.editModal,
            {
              backgroundColor: theme.dark ? '#1E1E1E' : theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              variant="titleMedium"
              style={[styles.modalHeaderTitle, { color: theme.colors.onSurface }]}
            >
              Edit Category
            </Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={() => setEditingCategory(null)}
              style={styles.closeButton}
            />
          </View>
          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
          >
          <TextInput
            mode="outlined"
            label="Name"
            value={editName}
            onChangeText={setEditName}
            style={styles.input}
          />
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>
            Type
          </Text>
          <RadioButton.Group value={editType} onValueChange={setEditType}>
            <View style={styles.typeRow}>
              <RadioButton value="expense" />
              <Text style={[styles.typeLabel, { color: theme.colors.onSurface }]}>
                Expense
              </Text>
              <RadioButton value="income" />
              <Text style={[styles.typeLabel, { color: theme.colors.onSurface }]}>
                Income
              </Text>
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
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>
            Chart Color
          </Text>
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
            <View style={styles.modalActions}>
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
                style={styles.deleteButton}
              >
                Delete
              </Button>
              <Button
                mode="contained"
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary || '#FFFFFF'}
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
                style={styles.saveButton}
              >
                Save
              </Button>
            </View>
          </ScrollView>
        </Modal>
        <Modal
          visible={iconPickerVisible}
          onDismiss={() => setIconPickerVisible(false)}
          contentContainerStyle={[
            styles.iconModal,
            {
              backgroundColor: theme.dark ? '#1E1E1E' : theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              variant="titleMedium"
              style={[styles.modalHeaderTitle, { color: theme.colors.onSurface }]}
            >
              Choose Icon
            </Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={() => setIconPickerVisible(false)}
              style={styles.closeButton}
            />
          </View>
          <ScrollView 
            style={styles.iconModalScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.iconModalContent}
          >
            {ICON_GROUPS.map(group => (
              <View key={group.key} style={styles.iconGroup}>
                <Text
                  style={[styles.iconGroupLabel, { color: theme.colors.onSurface }]}
                >
                  {group.label}
                </Text>
                <View style={styles.iconGrid}>
                  {group.icons.map(option => {
                    const selected = icon === option.icon;
                    return (
                      <TouchableOpacity
                        key={option.icon}
                        style={[
                          styles.iconOption,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.outline,
                          },
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
          </ScrollView>
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
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
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
  listDivider: {
    height: 1,
    opacity: 0.1,
  },
  iconModal: {
    margin: 20,
    padding: 0,
    borderRadius: 16,
    maxHeight: '85%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  iconModalScrollView: {
    maxHeight: 500,
  },
  iconModalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  editModal: {
    margin: 20,
    padding: 0,
    borderRadius: 16,
    maxHeight: '85%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalHeaderTitle: {
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  modalScrollView: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  deleteButton: {
    minWidth: 80,
  },
  saveButton: {
    minWidth: 80,
  },
  colorModal: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    borderColor: '#1A73E8',
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
});


