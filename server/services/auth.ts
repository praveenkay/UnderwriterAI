import { storage } from "../storage";
import type { User } from "../../client/src/contexts/AuthContext";

// Demo users for testing
const demoUsers = [
  {
    id: "1",
    username: "admin@zurich.com",
    password: "admin123",
    email: "admin@zurich.com",
    role: "zurich_admin" as const,
    firstName: "Admin",
    lastName: "User",
    company: "Zurich Insurance"
  },
  {
    id: "2", 
    username: "user@zurich.com",
    password: "user123",
    email: "user@zurich.com",
    role: "zurich_user" as const,
    firstName: "John",
    lastName: "Smith",
    company: "Zurich Insurance"
  },
  {
    id: "3",
    username: "broker@external.com", 
    password: "broker123",
    email: "broker@external.com",
    role: "external_broker" as const,
    firstName: "Jane",
    lastName: "Broker",
    company: "External Broker Ltd"
  }
];

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  // For demo purposes, use hardcoded users
  const user = demoUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  return null;
}

export async function getUserById(id: string): Promise<User | null> {
  const user = demoUsers.find(u => u.id === id);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  return null;
}
