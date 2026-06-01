"use client";

import { useState, useEffect } from 'react';
import { Order, Filament } from '../../types';
import { getStorageData } from '../../lib/storage';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);

  useEffect(() => {
    const loadData = () => {
      setOrders(getStorageData<Order>('orders'));
      setFilaments(getStorageData<Filament>('filaments'));
    };
    loadData();
    window.addEventListener('storage-updated', loadData);
    return () => window.removeEventListener('storage-updated', loadData);
  }, []);

  const faturamento = orders.filter(o => o.status === 'Concluído').reduce((acc, curr) => acc + curr.finalPrice, 0);
  const ativas = orders.filter(o => o.status === 'Pendente' || o.status === 'Imprimindo').length;
  const estoqueBaixo = filaments.filter(f => f.currentWeightG < 100).length;
  const sucessoRate = orders.length > 0 
    ? ((orders.filter(o => o.status === 'Concluído').length / orders.length) * 100).toFixed(0) 
    : '100';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Visão Geral</h2>
        <p className="text-[var(--solar-base1)] mt-1">Resumo das atividades da sua fazenda de impressão 3D.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
          <h3 className="text-sm font-medium text-[var(--solar-base1)]">Faturamento Acumulado</h3>
          <p className="text-3xl font-bold text-[var(--solar-green)] mt-2">R$ {faturamento.toFixed(2)}</p>
        </div>
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
          <h3 className="text-sm font-medium text-[var(--solar-base1)]">Impressões Pendentes</h3>
          <p className="text-3xl font-bold text-[var(--solar-blue)] mt-2">{ativas}</p>
        </div>
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
          <h3 className="text-sm font-medium text-[var(--solar-base1)]">Alertas de Estoque</h3>
          <p className="text-3xl font-bold text-[var(--solar-red)] mt-2">{estoqueBaixo}</p>
          <p className="text-xs text-[var(--solar-base01)] mt-1">Rolos com menos de 100g</p>
        </div>
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
          <h3 className="text-sm font-medium text-[var(--solar-base1)]">Taxa de Sucesso</h3>
          <p className="text-3xl font-bold text-[var(--solar-yellow)] mt-2">{sucessoRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)]">
          <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-4">Impressões Recentes</h3>
          {orders.length === 0 ? (
            <div className="text-[var(--solar-base1)] text-sm flex items-center justify-center h-32">
              Nenhuma impressão registrada ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(-5).reverse().map(order => (
                <div key={order.id} className="flex justify-between items-center border-b border-[var(--solar-base03)] pb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    order.status === 'Pendente' ? 'bg-[var(--solar-yellow)] text-[var(--solar-base03)]' : 
                    order.status === 'Concluído' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' : 
                    'bg-[var(--solar-base01)] text-[var(--solar-base03)]'
                  }`}>
                    {order.status}
                  </span>
                  <span className="text-[var(--solar-green)] font-bold">R$ {order.finalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)]">
          <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-4">Estoque Rápido</h3>
          {filaments.length === 0 ? (
            <div className="text-[var(--solar-base1)] text-sm flex items-center justify-center h-32">
              Nenhum filamento cadastrado.
            </div>
          ) : (
            <div className="space-y-4">
              {filaments.slice(0, 5).map(f => (
                <div key={f.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.colorHex }}></div>
                    <span className="text-[var(--solar-base1)] text-sm">{f.brand} - {f.colorName}</span>
                  </div>
                  <span className={`text-sm font-bold ${f.currentWeightG < 100 ? 'text-[var(--solar-red)]' : 'text-[var(--solar-base0)]'}`}>
                    {f.currentWeightG}g
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
