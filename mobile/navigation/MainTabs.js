import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import AttendanceScreen from "../screens/AttendanceScreen";
import AssignmentsScreen from "../screens/AssignmentsScreen";
import ExamsScreen from "../screens/ExamsScreen";
import ExamTakeScreen from "../screens/ExamTakeScreen";
import ProgressScreen from "../screens/ProgressScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();
const ExamStack = createNativeStackNavigator();

function ExamsStackScreen() {
  return (
    <ExamStack.Navigator>
      <ExamStack.Screen name="ExamsList" component={ExamsScreen} options={{ title: "Exams", headerShown: false }} />
      <ExamStack.Screen name="ExamTake" component={ExamTakeScreen} options={{ title: "Exam" }} />
    </ExamStack.Navigator>
  );
}

const icons = { Attendance: "📅", Assignments: "📝", Exams: "🎓", Progress: "📊" };

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.slate,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{icons[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Assignments" component={AssignmentsScreen} />
      <Tab.Screen name="Exams" component={ExamsStackScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}
