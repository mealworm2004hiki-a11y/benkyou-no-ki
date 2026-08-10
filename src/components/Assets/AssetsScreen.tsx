import { useState } from 'react';
import { Passbook } from './Passbook';
import { RankCard } from './RankCard';
import { RewardManager } from './RewardManager';
import { RewardRedeemList } from './RewardRedeemList';
import { InvestScreen } from './InvestScreen';

type AssetsTab = 'passbook' | 'rank' | 'rewards' | 'invest';

const SUB_TABS: { id: AssetsTab; label: string }[] = [
  { id: 'passbook', label: '通帳' },
  { id: 'rank', label: 'ランク' },
  { id: 'rewards', label: 'ご褒美' },
  { id: 'invest', label: '投資' },
];

export function AssetsScreen() {
  const [sub, setSub] = useState<AssetsTab>('passbook');

  return (
    <div className="screen assets-screen">
      <h1 className="screen-title">資産</h1>

      <div className="subnav">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            className={`subnav-btn ${sub === t.id ? 'active' : ''}`}
            onClick={() => setSub(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'passbook' && <Passbook />}
      {sub === 'rank' && <RankCard />}
      {sub === 'rewards' && (
        <>
          <section className="section">
            <h2 className="section-title">交換する</h2>
            <RewardRedeemList />
          </section>
          <section className="section">
            <h2 className="section-title">ご褒美を編集</h2>
            <RewardManager />
          </section>
        </>
      )}
      {sub === 'invest' && <InvestScreen />}
    </div>
  );
}
