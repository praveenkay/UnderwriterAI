import { storage } from "../storage";
import type { User } from "../../client/src/contexts/AuthContext";

// Demo users for testing
const demoUsers = [
  {
    id: "1",
    username: "admin@company.com",
    password: "admin123",
    email: "admin@company.com",
    role: "admin" as const,
    firstName: "Admin",
    lastName: "User",
    company: "UnderwriterAI",
    phone: "+44 20 7648 7000",
    address: "70 Mark Lane, London EC3R 7NQ, UK",
    region: "London & South East",
    title: "System Administrator",
    department: "IT Operations",
    joinDate: "January 2020",
    specializations: ["System Administration", "User Management", "Security"]
  },
  {
    id: "2", 
    username: "user@company.com",
    password: "user123",
    email: "user@company.com",
    role: "standard_user" as const,
    firstName: "John",
    lastName: "Smith",
    company: "UnderwriterAI",
    phone: "+44 20 7648 7001",
    address: "70 Mark Lane, London EC3R 7NQ, UK",
    region: "London & South East",
    title: "Senior Underwriter",
    department: "Commercial Underwriting",
    joinDate: "March 2019",
    specializations: ["Commercial Property", "Liability Insurance", "Risk Assessment"]
  },
  {
    id: "3",
    username: "broker@external.com", 
    password: "broker123",
    email: "broker@external.com",
    role: "external_broker" as const,
    firstName: "Jane",
    lastName: "Broker",
    company: "External Broker Ltd",
    phone: "+44 20 7123 4567",
    address: "25 Fenchurch Street, London EC3M 3BE, UK",
    region: "London & South East",
    title: "Senior Insurance Broker",
    department: "Commercial Lines",
    licenseNumber: "UK-BRK-789123",
    joinDate: "June 2018",
    specializations: ["SME Insurance", "Commercial Property", "Professional Indemnity"]
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
