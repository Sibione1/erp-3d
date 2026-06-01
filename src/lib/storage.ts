"use client";

import { Filament, Client, Project, Order } from '../types';
import { supabase } from './supabase';

const isBrowser = typeof window !== 'undefined';

export const getStorageData = <T>(key: string): T[] => {
  if (!isBrowser) return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const setStorageData = (key: string, data: any[]) => {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event('storage-updated'));
};

// --- SYNC ENGINE ---
export const syncFromSupabase = async () => {
  if (!isBrowser) return;
  try {
    const [filaments, clients, projects, orders] = await Promise.all([
      supabase.from('filaments').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('orders').select('*')
    ]);

    if (filaments.data) setStorageData('filaments', filaments.data.map(mapFromDb));
    if (clients.data) setStorageData('clients', clients.data.map(mapFromDb));
    if (projects.data) setStorageData('projects', projects.data.map(mapFromDb));
    if (orders.data) setStorageData('orders', orders.data.map(mapFromDb));
  } catch (e) {
    console.error('Error syncing from Supabase', e);
  }
};

// Helper para converter snake_case do DB para camelCase do App
const mapFromDb = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
};

const mapToDb = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = obj[key];
  }
  return newObj;
};

// Helpers for specific entities
export const addFilament = (filament: Omit<Filament, 'id' | 'createdAt'>) => {
  const filaments = getStorageData<Filament>('filaments');
  const newFilament: Filament = {
    ...filament,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('filaments', [...filaments, newFilament]);
  supabase.from('filaments').insert([mapToDb(newFilament)]).then();
  return newFilament;
};

export const updateFilament = (id: string, data: Partial<Filament>) => {
  const filaments = getStorageData<Filament>('filaments');
  const index = filaments.findIndex(f => f.id === id);
  if (index !== -1) {
    filaments[index] = { ...filaments[index], ...data };
    setStorageData('filaments', filaments);
    supabase.from('filaments').update(mapToDb(data)).eq('id', id).then();
  }
};

export const deleteFilament = (id: string) => {
  const filaments = getStorageData<Filament>('filaments');
  setStorageData('filaments', filaments.filter(f => f.id !== id));
  supabase.from('filaments').delete().eq('id', id).then();
};

export const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
  const clients = getStorageData<Client>('clients');
  const newClient: Client = {
    ...client,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('clients', [...clients, newClient]);
  supabase.from('clients').insert([mapToDb(newClient)]).then();
  return newClient;
};

export const updateClient = (id: string, data: Partial<Client>) => {
  const clients = getStorageData<Client>('clients');
  const index = clients.findIndex(c => c.id === id);
  if (index !== -1) {
    clients[index] = { ...clients[index], ...data };
    setStorageData('clients', clients);
    supabase.from('clients').update(mapToDb(data)).eq('id', id).then();
  }
};

export const deleteClient = (id: string) => {
  const clients = getStorageData<Client>('clients');
  setStorageData('clients', clients.filter(c => c.id !== id));
  supabase.from('clients').delete().eq('id', id).then();
};

export const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
  const projects = getStorageData<Project>('projects');
  const newProject: Project = {
    ...project,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('projects', [...projects, newProject]);
  supabase.from('projects').insert([mapToDb(newProject)]).then();
  return newProject;
};

export const updateProject = (id: string, data: Partial<Project>) => {
  const projects = getStorageData<Project>('projects');
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...data };
    setStorageData('projects', projects);
    supabase.from('projects').update(mapToDb(data)).eq('id', id).then();
  }
};

export const deleteProject = (id: string) => {
  const projects = getStorageData<Project>('projects');
  setStorageData('projects', projects.filter(p => p.id !== id));
  supabase.from('projects').delete().eq('id', id).then();
};

export const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
  const orders = getStorageData<Order>('orders');
  const newOrder: Order = {
    ...order,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  setStorageData('orders', [...orders, newOrder]);
  supabase.from('orders').insert([mapToDb(newOrder)]).then();
  return newOrder;
};

export const updateOrder = (id: string, data: Partial<Order>) => {
  const orders = getStorageData<Order>('orders');
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...data };
    setStorageData('orders', orders);
    supabase.from('orders').update(mapToDb(data)).eq('id', id).then();
  }
};

export const deleteOrder = (id: string) => {
  const orders = getStorageData<Order>('orders');
  setStorageData('orders', orders.filter(o => o.id !== id));
  supabase.from('orders').delete().eq('id', id).then();
};
