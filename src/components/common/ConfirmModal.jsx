import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function ConfirmModal({ show, onHide, onConfirm, title='Confirm Delete', message='Are you sure you want to delete this record?' }) {
  return <Modal show={show} onHide={onHide} centered>
    <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
    <Modal.Body>{message}</Modal.Body>
    <Modal.Footer>
      <Button variant="light" onClick={onHide}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm}>Delete</Button>
    </Modal.Footer>
  </Modal>;
}