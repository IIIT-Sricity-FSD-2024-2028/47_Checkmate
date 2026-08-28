import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button } from '../../components/common/CommonComponents';
import { messageService } from '../../services/api';

export const ClientCoordination = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const fetchMessages = async () => {
    try {
      const data = await messageService.getAll();
      setMessages(data || [
        { id: 1, sender: 'Vendor Coordinator', message: 'Hello! We have assigned sound and stage staff for your Corporate Gala.', time: '09:30 AM' },
        { id: 2, sender: 'Client', message: 'Awesome, can we confirm the sound test timing?', time: '09:45 AM' }
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
      await messageService.send({ text, recipient: 'Vendor', sender: 'Client' });
      setText('');
      fetchMessages();
    } catch (e) {
      setMessages([...messages, { id: Date.now(), sender: 'Client', message: text, time: 'Just now' }]);
      setText('');
    }
  };

  return (
    <DashboardLayout title="Client Coordination" subtitle="Direct chat with vendor manager and assigned event team">
      <Card title="Vendor Chat Channel">
        <div style={{ display: 'flex', flexDirection: 'column', height: '420px', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
            {messages.map((m) => (
              <div key={m.id} style={{ background: m.sender === 'Client' ? 'rgba(233,30,140,0.15)' : 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '10px', alignSelf: m.sender === 'Client' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
                  <strong style={{ color: '#ec4899', fontSize: '13px' }}>{m.sender}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{m.time}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#fff' }}>{m.message || m.text}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <input
              type="text"
              placeholder="Ask a question about your event..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </Card>
    </DashboardLayout>
  );
};
