"use client";

import { useState, useEffect } from 'react';
import { Order, Client, Filament, Project } from '../../types';
import { getStorageData, updateOrder, updateFilament } from '../../lib/storage';

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const loadData = () => {
    setOrders(getStorageData<Order>('orders'));
    setClients(getStorageData<Client>('clients'));
    setFilaments(getStorageData<Filament>('filaments'));
    setProjects(getStorageData<Project>('projects'));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const activeOrders = orders.filter(o => !o.isQuote);

  const handleUpdatePayment = (orderId: string, status: 'Pendente' | 'Pago', method?: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência') => {
    updateOrder(orderId, { paymentStatus: status, paymentMethod: method });
    loadData();
  };

  const handleItemStatus = (orderId: string, itemId: string, newStatus: 'Concluído' | 'Falha') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const item = order.items.find(i => i.id === itemId);
    if (!item) return;

    // Se já estava concluído ou falho, não deduz de novo
    if (item.status === 'Concluído' || item.status === 'Falha') {
      alert('Este item já teve sua baixa de estoque realizada.');
      return;
    }

    if (newStatus === 'Concluído') {
      if (confirm(`Finalizar item e dar baixa de filamento no estoque?`)) {
        // Deduz filamento
        const project = projects.find(p => p.id === item.projectId);
        if (project && item.filamentIds && item.filamentIds.length > 0) {
          const gramsPerFilament = project.estimatedConsumptionG / item.filamentIds.length;
          item.filamentIds.forEach(fId => {
            const fil = filaments.find(f => f.id === fId);
            if (fil) {
              updateFilament(fil.id, { currentWeightG: fil.currentWeightG - gramsPerFilament });
            }
          });
        }
        
        const updatedItems = order.items.map(i => i.id === itemId ? { ...i, status: newStatus } : i);
        updateOrder(orderId, { items: updatedItems });
        loadData();
      }
    } else if (newStatus === 'Falha') {
      const wastedStr = prompt('Ocorreu uma falha. Quantas gramas foram desperdiçadas? (Digite o número de gramas)');
      if (wastedStr) {
        const wastedGrams = Number(wastedStr);
        if (!isNaN(wastedGrams) && wastedGrams > 0) {
          // Calcula custo do desperdício
          let wastedCost = 0;
          if (item.filamentIds && item.filamentIds.length > 0) {
             let avgCostPerGram = 0;
             item.filamentIds.forEach(fId => {
               const fil = filaments.find(f => f.id === fId);
               if(fil) {
                 avgCostPerGram += (fil.purchaseCost / fil.initialWeightG);
                 // Desconta do estoque a grama desperdiçada (dividido pelas cores usadas na falha)
                 updateFilament(fil.id, { currentWeightG: fil.currentWeightG - (wastedGrams / item.filamentIds.length) });
               }
             });
             avgCostPerGram = avgCostPerGram / item.filamentIds.length;
             wastedCost = wastedGrams * avgCostPerGram;
          }

          const updatedItems = order.items.map(i => i.id === itemId ? { ...i, status: newStatus, wastedGrams, wastedCost } : i);
          updateOrder(orderId, { items: updatedItems });
          loadData();
        }
      }
    }
  };

  const handleOrderStatus = (orderId: string, status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado') => {
    updateOrder(orderId, { status });
    loadData();
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Pedidos em Andamento</h2>
        <p className="text-[var(--solar-base1)] mt-1">Gerencie a produção e o faturamento das vendas fechadas.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {activeOrders.map(order => {
          const client = clients.find(c => c.id === order.clientId);
          
          return (
            <div key={order.id} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm flex flex-col">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-[var(--solar-base1)] text-xs font-mono mb-1">{order.orderNumber}</span>
                  <select 
                    value={order.status} 
                    onChange={e => handleOrderStatus(order.id, e.target.value as any)}
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      order.status === 'Pendente' ? 'bg-[var(--solar-yellow)] text-[var(--solar-base03)]' : 
                      order.status === 'Em Andamento' ? 'bg-[var(--solar-blue)] text-[var(--solar-base03)]' : 
                      order.status === 'Concluído' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' : 
                      'bg-[var(--solar-base01)] text-[var(--solar-base03)]'
                    }`}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[var(--solar-base1)] text-xs font-bold">Cliente</span>
                  <span className="text-[var(--solar-base2)] text-base font-bold">{client?.fullName || 'Desconhecido'}</span>
                </div>
              </div>

              <div className="bg-[var(--solar-base03)] p-4 rounded-xl border border-[var(--solar-base01)] mb-4 space-y-4">
                <h4 className="text-xs font-bold text-[var(--solar-base1)] uppercase tracking-wider">Itens do Pedido</h4>
                {order.items.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--solar-base02)] pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-[var(--solar-base0)] font-bold">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          item.status === 'Concluído' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' :
                          item.status === 'Falha' ? 'bg-[var(--solar-red)] text-[var(--solar-base03)]' :
                          'bg-[var(--solar-base01)] text-[var(--solar-base03)]'
                        }`}>
                          {item.status}
                        </span>
                        {item.wastedGrams > 0 && <span className="text-[10px] text-[var(--solar-red)]">-{item.wastedGrams}g perdidos</span>}
                      </div>
                    </div>
                    
                    {item.status !== 'Concluído' && item.status !== 'Falha' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleItemStatus(order.id, item.id, 'Falha')} className="text-xs bg-[var(--solar-red)] text-[var(--solar-base03)] px-2 py-1 rounded font-bold hover:opacity-90">Falha (Desperdício)</button>
                        <button onClick={() => handleItemStatus(order.id, item.id, 'Concluído')} className="text-xs bg-[var(--solar-green)] text-[var(--solar-base03)] px-2 py-1 rounded font-bold hover:opacity-90">Concluído</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-end mt-auto pt-4 border-t border-[var(--solar-base01)]">
                <div>
                  <label className="block text-xs font-bold text-[var(--solar-base1)] mb-1">Pagamento</label>
                  <div className="flex gap-2">
                    <select 
                      value={order.paymentStatus} 
                      onChange={e => handleUpdatePayment(order.id, e.target.value as any, order.paymentMethod)}
                      className={`text-xs px-2 py-1 rounded font-bold ${order.paymentStatus === 'Pago' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' : 'bg-[var(--solar-red)] text-[var(--solar-base03)]'}`}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                    </select>
                    
                    {order.paymentStatus === 'Pago' && (
                      <select 
                        value={order.paymentMethod || ''} 
                        onChange={e => handleUpdatePayment(order.id, 'Pago', e.target.value as any)}
                        className="text-xs px-2 py-1 rounded bg-[var(--solar-base03)] text-[var(--solar-base0)] border border-[var(--solar-base01)]"
                      >
                        <option value="">Forma de Pgto</option>
                        <option value="PIX">PIX</option>
                        <option value="Cartão">Cartão</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Transferência">Transferência</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-[var(--solar-base1)]">Valor Total</p>
                  <p className="text-xl font-bold text-[var(--solar-yellow)]">R$ {order.finalPrice.toFixed(2)}</p>
                </div>
              </div>

            </div>
          );
        })}

        {activeOrders.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
            <p className="text-[var(--solar-base1)]">Nenhum pedido em andamento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
