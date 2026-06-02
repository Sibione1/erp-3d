"use client";

import { useState, useEffect } from 'react';
import { Order, Filament, Project } from '../types';
import { getStorageData } from '../lib/storage';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadData = () => {
      setOrders(getStorageData<Order>('orders'));
      setFilaments(getStorageData<Filament>('filaments'));
      setProjects(getStorageData<Project>('projects'));
    };
    loadData();
    window.addEventListener('storage-updated', loadData);
    return () => window.removeEventListener('storage-updated', loadData);
  }, []);

  // Filter types
  const quotes = orders.filter(o => o.isQuote);
  const activeOrders = orders.filter(o => !o.isQuote && o.status !== 'Concluído' && o.status !== 'Cancelado');
  const finishedOrders = orders.filter(o => !o.isQuote && o.status === 'Concluído');

  // Finance
  // Receita bruta: Soma dos valores finais dos pedidos PAGOS
  const paidOrders = orders.filter(o => !o.isQuote && o.paymentStatus === 'Pago');
  const grossRevenue = paidOrders.reduce((acc, curr) => acc + curr.finalPrice, 0);
  
  // Custos Operacionais: Soma do custo (calculatedCost) dos pedidos PAGOS (ou de todos? Vamos usar todos os concluídos para refletir o custo real executado)
  const executedCost = finishedOrders.reduce((acc, curr) => acc + curr.calculatedCost, 0);
  
  // Receita Líquida
  const netRevenue = grossRevenue - executedCost;

  // Wasted
  let totalWastedGrams = 0;
  let totalWastedCost = 0;
  let totalMachineHours = 0;

  orders.filter(o => !o.isQuote).forEach(order => {
    (order.items || []).forEach(item => {
      if (item.status === 'Falha') {
        totalWastedGrams += item.wastedGrams || 0;
        totalWastedCost += item.wastedCost || 0;
      }
      if (item.status === 'Concluído' && item.type === '3D_PROJECT') {
        const proj = projects.find(p => p.id === item.projectId);
        if (proj) {
          totalMachineHours += (proj.estimatedPrintTimeMinutes / 60);
        }
      }
    });
  });

  // Stock
  const lowStock = filaments.filter(f => f.currentWeightG < 100).length;
  const totalStockValue = filaments.reduce((acc, curr) => acc + curr.purchaseCost, 0); // Simplificação: valor total pago pelos rolos no estoque

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Dashboard ERP</h2>
        <p className="text-[var(--solar-base1)] mt-1">Gestão financeira e operacional da sua fazenda de impressão 3D.</p>
      </div>

      {/* FINANCEIRO */}
      <section>
        <h3 className="text-xl font-bold text-[var(--solar-base1)] mb-4 border-b border-[var(--solar-base02)] pb-2">Financeiro (Pedidos Pagos e Concluídos)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
            <h4 className="text-sm font-bold text-[var(--solar-base1)] uppercase">Receita Bruta</h4>
            <p className="text-3xl font-bold text-[var(--solar-green)] mt-2">R$ {grossRevenue.toFixed(2)}</p>
            <p className="text-xs text-[var(--solar-base00)] mt-1">Soma de todos os pagamentos recebidos</p>
          </div>
          <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
            <h4 className="text-sm font-bold text-[var(--solar-base1)] uppercase">Custos de Produção</h4>
            <p className="text-3xl font-bold text-[var(--solar-orange)] mt-2">R$ {executedCost.toFixed(2)}</p>
            <p className="text-xs text-[var(--solar-base00)] mt-1">Energia, máquina e filamento (Pedidos Concluídos)</p>
          </div>
          <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
            <h4 className="text-sm font-bold text-[var(--solar-base1)] uppercase">Lucro Líquido</h4>
            <p className="text-3xl font-bold text-[var(--solar-blue)] mt-2">R$ {netRevenue.toFixed(2)}</p>
            <p className="text-xs text-[var(--solar-base00)] mt-1">O que sobra no bolso do negócio</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OPERACIONAL */}
        <section>
          <h3 className="text-xl font-bold text-[var(--solar-base1)] mb-4 border-b border-[var(--solar-base02)] pb-2">Métricas Operacionais</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--solar-base02)] p-4 rounded-xl border border-[var(--solar-base01)]">
              <p className="text-xs font-bold text-[var(--solar-base1)] uppercase">Orçamentos Pendentes</p>
              <p className="text-2xl font-bold text-[var(--solar-base2)] mt-1">{quotes.length}</p>
            </div>
            <div className="bg-[var(--solar-base02)] p-4 rounded-xl border border-[var(--solar-base01)]">
              <p className="text-xs font-bold text-[var(--solar-base1)] uppercase">Pedidos em Andamento</p>
              <p className="text-2xl font-bold text-[var(--solar-yellow)] mt-1">{activeOrders.length}</p>
            </div>
            <div className="bg-[var(--solar-base02)] p-4 rounded-xl border border-[var(--solar-base01)]">
              <p className="text-xs font-bold text-[var(--solar-base1)] uppercase">Pedidos Entregues</p>
              <p className="text-2xl font-bold text-[var(--solar-green)] mt-1">{finishedOrders.length}</p>
            </div>
            <div className="bg-[var(--solar-base02)] p-4 rounded-xl border border-[var(--solar-base01)]">
              <p className="text-xs font-bold text-[var(--solar-base1)] uppercase">Horas de Máquina</p>
              <p className="text-2xl font-bold text-[var(--solar-blue)] mt-1">{Math.round(totalMachineHours)}h</p>
            </div>
          </div>
        </section>

        {/* ESTOQUE E DESPERDÍCIO */}
        <section>
          <h3 className="text-xl font-bold text-[var(--solar-base1)] mb-4 border-b border-[var(--solar-base02)] pb-2">Estoque e Desperdícios</h3>
          
          <div className="bg-[var(--solar-base02)] p-5 rounded-xl border border-[var(--solar-base01)] mb-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-[var(--solar-base1)]">Prejuízo com Falhas</p>
              <p className="text-xs text-[var(--solar-base00)] mt-1">{totalWastedGrams}g perdidas no lixo</p>
            </div>
            <p className="text-2xl font-bold text-[var(--solar-red)]">- R$ {totalWastedCost.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--solar-base02)] p-4 rounded-xl border border-[var(--solar-base01)]">
              <p className="text-xs font-bold text-[var(--solar-base1)] uppercase">Alertas de Reposição</p>
              <p className="text-2xl font-bold text-[var(--solar-orange)] mt-1">{lowStock}</p>
              <p className="text-xs text-[var(--solar-base00)] mt-1">Rolos &lt; 100g</p>
            </div>
            <div className="bg-[var(--solar-base02)] p-4 rounded-xl border border-[var(--solar-base01)]">
              <p className="text-xs font-bold text-[var(--solar-base1)] uppercase">Capital em Filamento</p>
              <p className="text-2xl font-bold text-[var(--solar-base0)] mt-1">R$ {totalStockValue.toFixed(2)}</p>
              <p className="text-xs text-[var(--solar-base00)] mt-1">Investimento Bruto</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
