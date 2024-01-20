const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const mypath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json());
let db = null

const InitDB = async () => {
  try {
    db = await open({
      filename: mypath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}
InitDB()
app.listen(3000)

const statetable = stat => {
  return {
    stateId: stat.state_id,
    stateName: stat.state_name,
    population: stat.population,
  }
}

const disttable = dis => {
  return {
    districtId: dis.district_id,
    districtName: dis.district_name,
    stateId: dis.state_id,
    cases: dis.cases,
    cured: dis.cured,
    active: dis.active,
    deaths: dis.deaths,
  }
}

const stat = st => {
  return {
    totalCases: st.cases,
    totalCured: st.cured,
    totalActive: st.active,
    totalDeaths: st.deaths,
  }
}

const d = dd => {
  return {
    stateName: dd.state_name,
  }
}
//get all states
app.get('/states/', async (request, response) => {
  const query = `SELECT * FROM state`
  const res = await db.all(query)
  console.log(res)
  response.send(res.map(all => statetable(all)))
})

//API 2 get particular state
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const QQuery = `SELECT * FROM state WHERE state_id = ${stateId}`
  const res = await db.get(QQuery)
  console.log(res)
  response.send(statetable(res))
})

//API 3 post

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const query = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
                  VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths})`
  await db.run(query, [districtName, stateId, cases, cured, active, deaths])
  response.send('District Successfully Added')
})
module.exports = app

//API 4 get particular district
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const Query = `SELECT * FROM district WHERE district_id = ${districtId}`
  const res = await db.get(Query)
  response.send(disttable(res))
})

//API 5 delete district
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const Query = `DELETE FROM district WHERE district_id = ${districtId}`
  await db.run(Query)
  response.send('District Removed')
})

//API 6
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const Query = `UPDATE district SET district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  active = ${active},
  deaths = ${deaths}`
  const res = await db.run(Query)
  response.send('District Details Updated')
})

//API 7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const Q = `SELECT SUM(cases) as totalCases,SUM(cured) as totalCured,SUM(active) as totalActive,SUM(deaths) as totalDeaths 
  FROM district WHERE state_id = ${stateId}`
  const rs = await db.get(Q)
  console.log(rs)
  response.send(rs)
})

//API 8

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const q = `SELECT * FROM 
  district INNER JOIN state ON state.state_id = district.state_id WHERE district_id = ${districtId}`
  const res = await db.get(q)
  response.send(d(res))
})
