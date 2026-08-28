import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button, Input } from '../../components/common/CommonComponents';
import { messageService } from '../../services/api';

export const AdminCoordination = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const fetchMessages = async () => {
    try {
      const data = await messageService.getAll();
      setMessages(data || [
        { id: 1, sender: 'Vendor - Apex Caterers', message: 'We have updated menu options for Event #201.', time: '10:30 AM' },
        { id: 2, sender: 'Staff - Alex Johnson', message: 'Staff schedule confirmed for Corporate Gala.', time: '11:15 AM' }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await messageService.send({ text, recipient: 'All', sender: 'Admin' });
      setText('');
      fetchMessages();
    } catch (e) {
      setMessages([...messages, { id: Date.now(), sender: 'Admin', message: text, time: 'Just now' }]);
      setText('');
    }
  };

  return (
    <DashboardLayout title="Admin Coordination Hub" subtitle="Direct cross-role communication and messaging channel">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <Card title="Active Communication Channels">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li style={{ padding: '12px', borderRadius: '8px', background: 'rgba(233,30,140,0.15)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}># Broadcast Channel</li>
            <li style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', cursor: 'pointer' }}># Vendor Leads</li>
            <li style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', cursor: 'pointer' }}># Staff Supervisors</li>
          </ul>
        </Card>

        <Card title="Broadcast Discussion">
          <div style={{ display: 'flex', flexDirection: 'column', height: '400px', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
              {messages.map((m) => (
                <div key={m.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#ec4899', fontSize: '13px' }}>{m.sender}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#cbd5e1' }}>{m.message || m.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <input
                type="text"
                placeholder="Type global admin announcement..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
