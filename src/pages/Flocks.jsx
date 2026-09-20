import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import PageHeader from '../components/common/PageHeader';
import ConfirmModal from '../components/common/ConfirmModal';
import { flocks as initial } from '../data/mockData';

export default function Flocks() {
 const [data,setData]=useState(()=>JSON.parse(localStorage.getItem('kf_flocks')||'null')||initial); const [search,setSearch]=useState(''); const [show,setShow]=useState(false); const [del,setDel]=useState(null);
 const [form,setForm]=useState({code:'',breed:'Layers',source:'',date:'',birds:'',age:'',status:'Active'});
 const save=()=>{const item={...form,id:Date.now(),birds:Number(form.birds),age:Number(form.age),mortality:0}; const next=[...data,item];setData(next);localStorage.setItem('kf_flocks',JSON.stringify(next));setShow(false);setForm({code:'',breed:'Layers',source:'',date:'',birds:'',age:'',status:'Active'});};
 const remove=()=>{const next=data.filter(x=>x.id!==del);setData(next);localStorage.setItem('kf_flocks',JSON.stringify(next));setDel(null)};
 const filtered=data.filter(x=>`${x.code} ${x.breed} ${x.source}`.toLowerCase().includes(search.toLowerCase()));
 return <><PageHeader title="Flock Management" subtitle="Manage your chicken flocks and monitor their performance." action={<button className="btn btn-success" onClick={()=>setShow(true)}><i className="bi bi-plus-lg me-2"/>Add New Flock</button>}/>
 <div className="filter-card"><div className="search-box"><i className="bi bi-search"/><input placeholder="Search flocks..." value={search} onChange={e=>setSearch(e.target.value)}/></div><select className="form-select"><option>All Status</option><option>Active</option><option>Closed</option></select></div>
 <div className="table-card"><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Flock</th><th>Breed</th><th>Start Date</th><th>Chickens</th><th>Age</th><th>Mortality</th><th>Status</th><th>Action</th></tr></thead><tbody>
 {filtered.map(f=><tr key={f.id}><td><Link className="record-link" to={`/flocks/${f.id}`}>{f.code}</Link></td><td>{f.breed}</td><td>{f.date}</td><td><strong>{f.birds.toLocaleString()}</strong></td><td>{f.age} weeks</td><td>{f.mortality}</td><td><span className="status active">{f.status}</span></td><td><div className="action-buttons"><Link to={`/flocks/${f.id}`} className="btn btn-sm btn-light"><i className="bi bi-eye"/></Link><button className="btn btn-sm btn-light" onClick={()=>setDel(f.id)}><i className="bi bi-trash text-danger"/></button></div></td></tr>)}
 </tbody></table></div></div>
 <Modal show={show} onHide={()=>setShow(false)} centered><Modal.Header closeButton><Modal.Title>Add New Flock</Modal.Title></Modal.Header><Modal.Body><div className="row g-3">
 {['code','source','date','birds','age'].map(k=><div className={k==='source'?'col-12':'col-md-6'} key={k}><label className="form-label">{k==='code'?'Flock Code':k==='source'?'Source':k==='date'?'Start Date':k==='birds'?'Number of Chickens':'Age (weeks)'}</label><input type={k==='date'?'date':k==='birds'||k==='age'?'number':'text'} className="form-control" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>)}
 <div className="col-md-6"><label className="form-label">Breed</label><select className="form-select" value={form.breed} onChange={e=>setForm({...form,breed:e.target.value})}><option>Layers</option><option>Broilers</option><option>Local</option></select></div>
 </div></Modal.Body><Modal.Footer><Button variant="light" onClick={()=>setShow(false)}>Cancel</Button><Button variant="success" onClick={save}>Save Flock</Button></Modal.Footer></Modal>
 <ConfirmModal show={!!del} onHide={()=>setDel(null)} onConfirm={remove}/>
 </>;
}