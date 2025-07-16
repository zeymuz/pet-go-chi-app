import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import COLORS from '../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 0,
        },
        // 👇 Add these for the header (top bar)
        headerStyle: {
          backgroundColor: COLORS.primary, // Your desired header color
        },
        headerTintColor: '#fff', // Text & icons color (e.g., back button)
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'PressStart2P', // Optional: Customize title font
        },
      }}
    >
      <Tabs.Screen
  name="home"
  options={{
    title: 'Pet',
    tabBarIcon: ({ color }) => <Ionicons name="paw" size={24} color={color} />,
    // 👇 Override label style for this tab only
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
            }
          ,
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
    </Tabs>
  );
}