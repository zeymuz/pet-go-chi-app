// app/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import COLORS from '../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarStyle: {
          backgroundColor: '#ffe3d7',
          borderTopWidth: 0,
          elevation: 0,
        },
        headerStyle: {
          backgroundColor: '#ffe3d7',
        },
        headerTintColor: '#FF6B6B',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'PressStart2P', 
          fontSize: 38,
          marginBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Pet',
          tabBarIcon: ({ color }) => <Ionicons name="paw" size={24} color={color} />,
          tabBarLabelStyle: {
            fontFamily: 'PressStart2P',
            fontSize: 14,
          },
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ color }) => <Ionicons name="cart" size={24} color={color} />,
          tabBarLabelStyle: {
            fontFamily: 'PressStart2P',
            fontSize: 14,
          },
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarIcon: ({ color }) => <Ionicons name="game-controller" size={24} color={color} />,
          tabBarLabelStyle: {
            fontFamily: 'PressStart2P',
            fontSize: 14,
          },
        }}
      />
      <Tabs.Screen
        name="coins"
        options={{
          title: 'Coins',
          tabBarIcon: ({ color }) => <Ionicons name="logo-bitcoin" size={24} color={color} />,
          tabBarLabelStyle: {
            fontFamily: 'PressStart2P',
            fontSize: 14,
          },
        }}
      />
    </Tabs>
  );
}


//looking at these files how do I set up the revenue cat stuff from zero and do I need new files tell me step by step and what to do please and give me the entire files completely 