import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import JsBarcode from "jsbarcode";
import { Boxes, LayoutDashboard, Package, AlertTriangle, Activity, LogOut, Plus, Search, ArrowDownToLine, ArrowUpFromLine, Trash2, Barcode, X, Pencil, ShieldCheck } from "lucide-react";

const cash = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);

function Auth({done}) {
  const [mode,setMode]=useState("login"), [form,setForm]=useState({name:"",email:"",password:""}), [error,setError]=useState(""), [busy,setBusy]=useState(false);
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if(mode==="register") await api("/auth/register",{method:"POST",body:JSON.stringify(form)});
      const d=await api("/auth/login",{method:"POST",body:JSON.stringify({email:form.email,password:form.password})});
      localStorage.setItem("stockpilot_token",d.token); localStorage.setItem("stockpilot_user",JSON.stringify(d.user)); done(d.user);
    } catch(err){setError(err.message)} finally{setBusy(false)}
  }
  return <div className="auth"><form className="authbox" onSubmit={submit}><div className="logo"><Boxes/></div><p className="kicker">STOCKPILOT INVENTORY</p><h1>{mode==="login"?"Welcome back":"Create your account"}</h1><p className="sub">Manage products, stock movements and inventory value.</p>
    {mode==="register"&&<label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
    <label>Email<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    <label>Password<input type="password" minLength="8" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
    {error&&<div className="error">{error}</div>}<button className="btn primary wide" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in":"Register & sign in"}</button>
    <p className="switch">{mode==="login"?"New here?":"Already registered?"} <button type="button" onClick={()=>{setMode(mode==="login"?"register":"login");setError("")}}>{mode==="login"?"Create account":"Sign in"}</button></p>
  </form></div>
}

function Modal({title,close,children}) { return <div className="shade" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="modal"><div className="modalhead"><h3>{title}</h3><button className="iconbtn" onClick={close}><X/></button></div>{children}</div></div> }

export default function App(){
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("stockpilot_user"))}catch{return null}});
  const [tab,setTab]=useState("Overview"),[products,setProducts]=useState([]),[stats,setStats]=useState(null),[history,setHistory]=useState([]);
  const [query,setQuery]=useState(""),[modal,setModal]=useState(""),[edit,setEdit]=useState(null),[notice,setNotice]=useState(""),[error,setError]=useState("");
  const blank={name:"",sku:"",category:"Electronics",quantity:0,price:0,reorderLevel:10,description:""};
  const [form,setForm]=useState(blank),[movement,setMovement]=useState({type:"IN",quantity:1,note:""});
  const [chosen,setChosen]=useState(null);
  async function load(){
    try{const [p,s,h]=await Promise.all([api("/products"),api("/dashboard"),api("/stock/history")]);setProducts(p);setStats(s);setHistory(h);setError("")}
    catch(e){setError(e.message)}
  }
  useEffect(()=>{if(user)load()},[user]);
  useEffect(()=>{if(notice){const t=setTimeout(()=>setNotice(""),3000);return()=>clearTimeout(t)}},[notice]);
  const low=products.filter(p=>p.quantity<=p.reorderLevel);
  const shown=useMemo(()=>products.filter(p=>`${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.toLowerCase())),[products,query]);
  function logout(){localStorage.removeItem("stockpilot_token");localStorage.removeItem("stockpilot_user");setUser(null)}
  function add(){setEdit(null);setForm(blank);setModal("product")}
  function change(p){setEdit(p);setForm({...p});setModal("product")}
  async function save(e){e.preventDefault();try{const body={...form,quantity:Number(form.quantity),price:Number(form.price),reorderLevel:Number(form.reorderLevel)};if(edit)await api(`/products/${edit._id}`,{method:"PUT",body:JSON.stringify(body)});else await api("/products",{method:"POST",body:JSON.stringify(body)});setModal("");setNotice(edit?"Product updated":"Product added");load()}catch(e){setError(e.message)}}
  async function remove(p){if(!confirm(`Delete ${p.name}?`))return;try{await api(`/products/${p._id}`,{method:"DELETE"});setNotice("Product deleted");load()}catch(e){setError(e.message)}}
  function stock(p,type){setChosen(p);setMovement({type,quantity:1,note:""});setModal("stock")}
  async function saveStock(e){e.preventDefault();try{await api(`/stock/${chosen._id}`,{method:"POST",body:JSON.stringify({...movement,quantity:Number(movement.quantity)})});setModal("");setNotice("Stock movement recorded");load()}catch(e){setError(e.message)}}
  function barcode(p){setChosen(p);setModal("barcode");setTimeout(()=>{const el=document.getElementById("sku-barcode");if(el)JsBarcode(el,p.sku,{format:"CODE128",displayValue:true,height:70,margin:12})},30)}
  if(!user)return <Auth done={setUser}/>;
  const nav=[["Overview",LayoutDashboard],["Products",Package],["Low stock",AlertTriangle],["Stock history",Activity]];
  return <div className="shell"><aside className="side"><div className="brand"><span className="brandicon"><Boxes/></span><span><b>StockPilot</b><small>INVENTORY SUITE</small></span></div><div className="warehouse"><i/> <span><b>Main warehouse</b><small>Workspace</small></span></div><p className="navlabel">WORKSPACE</p>
    {nav.map(([name,Icon])=><button key={name} className={`nav ${tab===name?"selected":""}`} onClick={()=>setTab(name)}><Icon size={18}/>{name}{name==="Low stock"&&low.length>0&&<em>{low.length}</em>}</button>)}
    <div className="sidebottom"><div className="secure"><ShieldCheck size={18}/> Signed in as {user.role}</div><button className="nav" onClick={logout}><LogOut size={18}/>Sign out</button></div></aside>
    <main className="main"><header className="top"><div><p className="kicker">INVENTORY MANAGEMENT</p><h2>{tab}</h2></div><div className="user"><span>{user.name?.[0]?.toUpperCase()}</span><div><b>{user.name}</b><small>{user.role}</small></div></div></header>
      <section className="content">{notice&&<div className="notice">{notice}<button onClick={()=>setNotice("")}>×</button></div>}{error&&<div className="errorbar">{error}<button onClick={()=>setError("")}>×</button></div>}
      {tab==="Overview"&&<><div className="welcome"><div><h1>Good to see you 👋</h1><p>Here's what's happening with your inventory today.</p></div><button className="btn" onClick={()=>setTab("Products")}>Manage inventory</button></div>
        <div className="stats">{[["Total products",stats?.productCount??"—",Package],["Units in stock",stats?.totalUnits??"—",Boxes],["Inventory value",cash(stats?.inventoryValue),Activity],["Low stock alerts",stats?.lowStockCount??"—",AlertTriangle]].map(([label,value,Icon],i)=><div className="stat"><span className={`staticon c${i}`}><Icon/></span><p>{label}</p><h2>{value}</h2><small>{["Active SKUs","Across all products","Based on unit price","At or below threshold"][i]}</small></div>)}</div>
        <div className="twocol"><div className="panel"><div className="paneltitle"><div><h3>Low stock watchlist</h3><p>Products that need attention</p></div><button className="link" onClick={()=>setTab("Low stock")}>View all</button></div>{low.slice(0,6).map(p=><div className="minirow"><span className="minibox"><Package size={17}/></span><span className="grow"><b>{p.name}</b><small>{p.sku}</small></span><strong className="lowtag">{p.quantity} left</strong></div>)}{!low.length&&<div className="empty">All stock levels look healthy.</div>}</div>
        <div className="panel"><div className="paneltitle"><div><h3>Recent movements</h3><p>Latest stock activity</p></div><button className="link" onClick={()=>setTab("Stock history")}>History</button></div>{history.slice(0,6).map(t=><div className="minirow"><span className={`moveicon ${t.type==="IN"?"green":"red"}`}>{t.type==="IN"?<ArrowDownToLine size={17}/>:<ArrowUpFromLine size={17}/>}</span><span className="grow"><b>{t.product?.name||"Product"}</b><small>{new Date(t.createdAt).toLocaleString()}</small></span><strong className={t.type==="IN"?"greenText":"redText"}>{t.type==="IN"?"+":"−"}{t.quantity}</strong></div>)}{!history.length&&<div className="empty">No stock movements yet.</div>}</div></div></>}
      {(tab==="Products"||tab==="Low stock")&&<><div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Search product, SKU or category…" value={query} onChange={e=>setQuery(e.target.value)}/></div>{tab==="Products"&&<button className="btn primary" onClick={add}><Plus size={17}/> Add product</button>}</div><div className="panel tablewrap"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>UNIT PRICE</th><th>QUANTITY</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{(tab==="Low stock"?low:shown).map(p=><tr key={p._id}><td><b>{p.name}</b><small>{p.description||"—"}</small></td><td><code>{p.sku}</code></td><td>{p.category}</td><td>{cash(p.price)}</td><td><b>{p.quantity}</b><small>Alert at {p.reorderLevel}</small></td><td><span className={`pill ${p.quantity<=p.reorderLevel?"warning":"good"}`}>{p.quantity<=p.reorderLevel?"Low stock":"In stock"}</span></td><td><div className="actions"><button title="Stock in" onClick={()=>stock(p,"IN")}><ArrowDownToLine/></button><button title="Stock out" onClick={()=>stock(p,"OUT")}><ArrowUpFromLine/></button><button title="Barcode" onClick={()=>barcode(p)}><Barcode/></button><button title="Edit" onClick={()=>change(p)}><Pencil/></button><button title="Delete" onClick={()=>remove(p)}><Trash2/></button></div></td></tr>)}</tbody></table>{(tab==="Low stock"?low:shown).length===0&&<div className="empty">No products found. Add a product to get started.</div>}</div></>}
      {tab==="Stock history"&&<div className="panel tablewrap"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>TYPE</th><th>QUANTITY</th><th>NOTE</th><th>DATE</th><th>USER</th></tr></thead><tbody>{history.map(t=><tr key={t._id}><td>{t.product?.name||"Deleted product"}</td><td>{t.product?.sku||"—"}</td><td><span className={`pill ${t.type==="IN"?"good":"warning"}`}>{t.type}</span></td><td>{t.quantity}</td><td>{t.note||"—"}</td><td>{new Date(t.createdAt).toLocaleString()}</td><td>{t.performedBy?.name||"—"}</td></tr>)}</tbody></table>{!history.length&&<div className="empty">No stock movement history yet.</div>}</div>}
      </section></main>
    {modal==="product"&&<Modal title={edit?"Edit product":"Add new product"} close={()=>setModal("")}><form className="formgrid" onSubmit={save}><label>Product name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>SKU / Barcode<input required value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["Electronics","Office supplies","Furniture","Accessories","Other"].map(x=><option key={x}>{x}</option>)}</select></label>{!edit&&<label>Opening quantity<input type="number" min="0" required value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></label>}<label>Unit price (₹)<input type="number" min="0" step="0.01" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Low-stock threshold<input type="number" min="0" value={form.reorderLevel} onChange={e=>setForm({...form,reorderLevel:e.target.value})}/></label><label className="span">Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="formactions span"><button type="button" className="btn" onClick={()=>setModal("")}>Cancel</button><button className="btn primary">{edit?"Save changes":"Add product"}</button></div></form></Modal>}
    {modal==="stock"&&<Modal title={`${movement.type==="IN"?"Receive":"Issue"} stock · ${chosen?.name}`} close={()=>setModal("")}><form className="formgrid" onSubmit={saveStock}><label>Movement<select value={movement.type} onChange={e=>setMovement({...movement,type:e.target.value})}><option value="IN">Stock in</option><option value="OUT">Stock out</option></select></label><label>Quantity<input type="number" min="1" required value={movement.quantity} onChange={e=>setMovement({...movement,quantity:e.target.value})}/></label><label className="span">Note<input value={movement.note} onChange={e=>setMovement({...movement,note:e.target.value})} placeholder="Purchase order / dispatch"/></label><p className="span">Available quantity: <b>{chosen?.quantity}</b></p><div className="formactions span"><button type="button" className="btn" onClick={()=>setModal("")}>Cancel</button><button className="btn primary">Confirm movement</button></div></form></Modal>}
    {modal==="barcode"&&<Modal title="Product barcode" close={()=>setModal("")}><div className="barcode"><h3>{chosen?.name}</h3><p>{chosen?.sku}</p><svg id="sku-barcode"></svg><button className="btn" onClick={()=>window.print()}>Print barcode</button></div></Modal>}
  </div>
}