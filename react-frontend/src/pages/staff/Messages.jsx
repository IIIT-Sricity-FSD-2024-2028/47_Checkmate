import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button } from '../../components/common/CommonComponents';

export const StaffMessages = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Vendor Manager', text: 'Alex, please handle stage cabling setup at 10 AM.', time: '09:15 AM' },
    { id: 2, sender: 'Alex Johnson (You)', text: 'On it! Testing cabling now.', time: '09:20 AM' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: 'Alex Johnson (You)', text: input, time: 'Just now' }]);
    setInput('');
  };

  return (
    <DashboardLayout title="Staff Team Chat" subtitle="Direct messages with vendor supervisor and fellow crew">
      <Card title="Team Messaging Channel">
        <div style={{ display: 'flex', flexDirection: 'column', height: '420px', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m) => (
              <div key={m.id} style={{ background: m.sender.includes('You') ? 'rgba(233,30,140,0.15)' : 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '10px', alignSelf: m.sender.includes('You') ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
                  <strong style={{ color: '#ec4899', fontSize: '13px' }}>{m.sender}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{m.time}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#fff' }}>{m.text}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <input
              type="text"
              placeholder="Send message to vendor supervisor..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </Card>
    </DashboardLayout>
  );
};
