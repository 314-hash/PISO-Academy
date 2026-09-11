import React, { useState } from 'react';
import {
  Award,
  ExternalLink,
  PlusCircle,
  Search,
  CheckCircle2,
  Tag,
  Github,
  Globe
} from 'lucide-react';
import { PISO_NETWORK } from '../pisoConfig';

interface Project {
  id: string;
  name: string;
  description: string;
  category: 'DeFi' | 'AI' | 'NFTs' | 'Identity' | 'Certificates' | 'Gaming' | 'Payments';
  contractAddress: string;
  author: string;
  githubUrl?: string;
  liveUrl?: string;
  tags: string[];
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Katunayan Hub',
    description: 'Soulbound digital certificate issuance & QR verification platform for academic institutions on PISO Chain.',
    category: 'Certificates',
    contractAddress: '0x0000000000000000000000000000000000001014',
    author: 'PISO Core Team',
    githubUrl: 'https://github.com/314-hash/piso-chain',
    liveUrl: 'https://piso-blockchain.vercel.app/',
    tags: ['Soulbound', 'ERC-5192', 'Precompile']
  },
  {
    id: 'proj-2',
    name: 'Bayanihan Swap DEX',
    description: 'Decentralized automated market maker (AMM) and yield farming protocol with zero-fee micro-liquidity pools.',
    category: 'DeFi',
    contractAddress: '0x1821F246a27287a2187E1D634B8883030fA14731',
    author: 'Bayani Guild',
    githubUrl: 'https://github.com/314-hash/piso-chain',
    tags: ['AMM', 'DEX', 'Liquidity']
  },
  {
    id: 'proj-3',
    name: 'Babaylan AI Oracle',
    description: 'Decentralized LLM inference verification pipeline connecting off-chain AI workers to on-chain smart contracts.',
    category: 'AI',
    contractAddress: '0x0000000000000000000000000000000000001009',
    author: 'AI Builders PH',
    tags: ['AI-Agents', 'Oracles', 'ZK-Inference']
  },
  {
    id: 'proj-4',
    name: 'Sari-Sari Merchant POS',
    description: 'Gasless micro-payment gateway for neighborhood convenience stores integrated with ERC-4337 Paymaster.',
    category: 'Payments',
    contractAddress: '0x0000000000000000000000000000000000001006',
    author: 'Manila Dev Lab',
    tags: ['AccountAbstraction', 'Paymaster', 'PointOfSale']
  }
];

export const ProjectDirectory: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<Project['category']>('DeFi');
  const [formContract, setFormContract] = useState('');
  const [formGithub, setFormGithub] = useState('');

  const categories = ['All', 'Certificates', 'DeFi', 'AI', 'Payments', 'NFTs', 'Identity', 'Gaming'];

  const filteredProjects = projects.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDesc || !formContract) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: formName,
      description: formDesc,
      category: formCategory,
      contractAddress: formContract,
      author: 'Community Builder',
      githubUrl: formGithub || undefined,
      tags: [formCategory, 'PISO-Chain']
    };

    setProjects([newProject, ...projects]);
    setShowSubmitModal(false);
    setFormName('');
    setFormDesc('');
    setFormContract('');
    setFormGithub('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Submit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Built on PISO</h1>
          <p className="text-sm text-slate-400 mt-1">
            Opisyal na direktoryo ng mga proyekto, dApps, at imprastraktura na binuo ng pamayanang Pilipino sa PISO Chain.
          </p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-glow flex items-center space-x-2 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Isumite ang Proyekto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Maghanap ng proyekto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            className="p-6 rounded-2xl bg-[#161F30] border border-slate-700/60 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-glow"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {p.category}
                </span>
                <span className="text-xs text-slate-400">{p.author}</span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                {p.name}
              </h3>
              <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                {p.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {p.tags.map((t, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-900/80 text-slate-400 font-mono">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] font-mono text-slate-400 truncate">
                Contract: <span className="text-slate-300">{p.contractAddress}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href={PISO_NETWORK.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-semibold"
                >
                  <span>PISO Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {p.githubUrl && (
                  <a
                    href={p.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-white"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#161F30] border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white">Isumite ang Iyong Proyekto sa PISO Ecosystem</h2>
            <p className="text-xs text-slate-300">
              Ibahagi ang iyong ginawang dApp o smart contract na tumatakbo sa PISO Chain.
            </p>

            <form onSubmit={handleSubmitProject} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Pangalan ng Proyekto:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Hal. Manila P2P Marketplace"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Kategorya:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="DeFi">DeFi</option>
                  <option value="AI">AI</option>
                  <option value="NFTs">NFTs</option>
                  <option value="Identity">Identity</option>
                  <option value="Certificates">Certificates</option>
                  <option value="Payments">Payments</option>
                  <option value="Gaming">Gaming</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Smart Contract Address sa PISO Chain:</label>
                <input
                  type="text"
                  required
                  value={formContract}
                  onChange={(e) => setFormContract(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Maikling Paglalarawan (Description):</label>
                <textarea
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="Ano ang nilulutas ng iyong proyekto..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">GitHub Repo Link (Opsyonal):</label>
                <input
                  type="url"
                  value={formGithub}
                  onChange={(e) => setFormGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Kanselahin
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-glow"
                >
                  Isumite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
