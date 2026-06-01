"use client";

import { useState, useEffect, useRef } from 'react';
import { Project } from '../../types';
import { getStorageData, addProject, deleteProject } from '../../lib/storage';

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    estimatedPrintTimeMinutes: 0,
    estimatedConsumptionG: 0,
    successRate: 100,
  });

  const loadProjects = () => {
    setProjects(getStorageData<Project>('projects'));
  };

  useEffect(() => {
    loadProjects();
    const handleStorage = () => loadProjects();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProject(formData);
    setIsAdding(false);
    setFormData({ name: '', imageUrl: '', estimatedPrintTimeMinutes: 0, estimatedConsumptionG: 0, successRate: 100 });
    loadProjects();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create local URL for preview
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      
      // Simulate AI Analysis
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        // Fake AI data extraction based on Bambu Studio typical prints
        setFormData(prev => ({
          ...prev,
          name: file.name.replace(/\.[^/.]+$/, "") || 'Novo Projeto Extraído',
          estimatedPrintTimeMinutes: Math.floor(Math.random() * 300) + 60, // 1h to 6h
          estimatedConsumptionG: Math.floor(Math.random() * 200) + 20, // 20g to 220g
          successRate: 98,
        }));
      }, 2500);
    }
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Projetos e Modelos 3D</h2>
          <p className="text-[var(--solar-base1)] mt-1">Faça upload de prints do fatiador para a IA extrair dados automaticamente.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[var(--solar-magenta)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Cancelar' : '+ Novo Projeto'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
          <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4">Adicionar Projeto (Upload Inteligente)</h3>
          
          <div className="mb-6">
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                ${isAnalyzing ? 'border-[var(--solar-yellow)] bg-[var(--solar-base03)]' : 'border-[var(--solar-base01)] hover:border-[var(--solar-blue)]'}`}
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              {isAnalyzing ? (
                <div className="animate-pulse">
                  <span className="text-4xl block mb-2">🤖</span>
                  <p className="text-[var(--solar-yellow)] font-bold">IA Analisando print do Bambu Studio...</p>
                  <p className="text-[var(--solar-base1)] text-sm">Lendo tempos, cores e filamentos...</p>
                </div>
              ) : formData.imageUrl ? (
                <div>
                  <img src={formData.imageUrl} alt="Preview" className="h-32 mx-auto rounded mb-4 object-contain" />
                  <p className="text-[var(--solar-green)] font-bold">✓ Imagem carregada</p>
                  <p className="text-[var(--solar-base1)] text-sm">Clique para alterar a imagem</p>
                </div>
              ) : (
                <div>
                  <span className="text-4xl block mb-2">📸</span>
                  <p className="text-[var(--solar-base1)] font-bold">Clique para fazer upload do Print do Fatiador</p>
                  <p className="text-[var(--solar-base01)] text-sm">A IA extrairá automaticamente o tempo e o material</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Nome do Projeto</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Tempo Estimado (minutos)</label>
              <input required type="number" value={formData.estimatedPrintTimeMinutes} onChange={e => setFormData({...formData, estimatedPrintTimeMinutes: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              <p className="text-xs text-[var(--solar-base01)] mt-1">Convertido: {formatTime(formData.estimatedPrintTimeMinutes)}</p>
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Consumo Total Estimado (Gramas)</label>
              <input required type="number" step="0.1" value={formData.estimatedConsumptionG} onChange={e => setFormData({...formData, estimatedConsumptionG: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Taxa de Sucesso (%)</label>
              <input required type="number" min="0" max="100" value={formData.successRate} onChange={e => setFormData({...formData, successRate: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
              <button type="submit" disabled={isAnalyzing} className="bg-[var(--solar-magenta)] text-[var(--solar-base2)] px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                Salvar Projeto
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] shadow-sm overflow-hidden flex flex-col">
            {project.imageUrl ? (
              <img src={project.imageUrl} alt={project.name} className="w-full h-40 object-cover bg-[var(--solar-base03)]" />
            ) : (
              <div className="w-full h-40 bg-[var(--solar-base03)] flex items-center justify-center border-b border-[var(--solar-base01)]">
                <span className="text-4xl">📦</span>
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4">{project.name}</h3>
              
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-[var(--solar-base03)] p-3 rounded border border-[var(--solar-base01)]">
                  <p className="text-[var(--solar-base1)] text-xs mb-1">Tempo</p>
                  <p className="text-[var(--solar-base2)] font-mono">{formatTime(project.estimatedPrintTimeMinutes)}</p>
                </div>
                <div className="bg-[var(--solar-base03)] p-3 rounded border border-[var(--solar-base01)]">
                  <p className="text-[var(--solar-base1)] text-xs mb-1">Consumo</p>
                  <p className="text-[var(--solar-base2)] font-mono">{project.estimatedConsumptionG}g</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--solar-base01)] flex gap-2">
                 <button 
                  onClick={() => {
                    if(confirm('Excluir este projeto?')) {
                      deleteProject(project.id);
                      loadProjects();
                    }
                  }}
                  className="flex-1 bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] text-xs py-2 rounded hover:bg-opacity-40 transition-colors"
                 >
                   Excluir
                 </button>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
            <p className="text-[var(--solar-base1)]">Nenhum projeto cadastrado.</p>
            <button onClick={() => setIsAdding(true)} className="text-[var(--solar-magenta)] mt-2 hover:underline">Faça upload do seu primeiro print</button>
          </div>
        )}
      </div>
    </div>
  );
}
