import React from 'react';
export default function EmptyState({ icon='bi-inbox', title='No records found', text='There are no records to display.' }) {
  return <div className="empty-state"><i className={`bi ${icon}`} /><h5>{title}</h5><p>{text}</p></div>;
}