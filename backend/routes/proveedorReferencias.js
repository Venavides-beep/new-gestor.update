import express from 'express';
import { poolFinance } from '../config/dbSql.js';
import mssql from 'mssql';

const router = express.Router();
router.get('/finance/proveedores/:id/referencias', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolFinance;
        //sadasdasdasdasds
        const result = await pool.request()
            .input('id', mssql.Int, id)
            .query('SELECT REFERENCIA FROM FINANCE_PROVEEDORES WHERE Id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        const raw = result.recordset[0].REFERENCIA;
        let referencias = [];
        if (raw) {
            try {
                referencias = JSON.parse(raw);
                if (!Array.isArray(referencias)) referencias = [];
            } catch {
                referencias = [];
            }
        }

        res.json({ referencias });
    } catch (error) {
        console.error('[Referencias] Error GET:', error.message);
        res.status(500).json({ error: 'Error al obtener referencias' });
    }
});
router.post('/finance/proveedores/:id/referencias', async (req, res) => {
    try {
        const { id } = req.params;
        const { dominio, ref, monto, fechaVencimientoDominio, diasRestantes, clienteNombre } = req.body;

        if (!dominio || !ref) {
            return res.status(400).json({ error: 'dominio y ref son obligatorios' });
        }

        const pool = await poolFinance;

        const result = await pool.request()
            .input('id', mssql.Int, id)
            .query('SELECT REFERENCIA FROM FINANCE_PROVEEDORES WHERE Id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        const raw = result.recordset[0].REFERENCIA;
        let referencias = [];
        if (raw) {
            try {
                referencias = JSON.parse(raw);
                if (!Array.isArray(referencias)) referencias = [];
            } catch {
                referencias = [];
            }
        }

        const yaExiste = referencias.some(r => r.ref === ref && r.dominio === dominio);
        if (yaExiste) {
            return res.status(409).json({ error: 'Esta referencia ya fue asignada a ese dominio', referencias });
        }

        const nuevaRef = {
            dominio,
            ref,
            monto: monto || 0,
            clienteNombre: clienteNombre || '',
            fechaVencimientoDominio: fechaVencimientoDominio || '',
            diasRestantes: diasRestantes ?? null,
            fechaAsignacion: new Date().toISOString().split('T')[0]
        };
        referencias.push(nuevaRef);

        await pool.request()
            .input('id', mssql.Int, id)
            .input('refs', mssql.NVarChar(mssql.MAX), JSON.stringify(referencias))
            .query('UPDATE FINANCE_PROVEEDORES SET REFERENCIA = @refs WHERE Id = @id');

        res.json({ success: true, referencias });
    } catch (error) {
        console.error('[Referencias] Error POST:', error.message);
        res.status(500).json({ error: 'Error al guardar referencia' });
    }
});

router.delete('/finance/proveedores/:id/referencias', async (req, res) => {
    try {
        const { id } = req.params;
        const { ref, dominio } = req.body;

        const pool = await poolFinance;

        const result = await pool.request()
            .input('id', mssql.Int, id)
            .query('SELECT REFERENCIA FROM FINANCE_PROVEEDORES WHERE Id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        const raw = result.recordset[0].REFERENCIA;
        let referencias = [];
        if (raw) {
            try {
                referencias = JSON.parse(raw);
                if (!Array.isArray(referencias)) referencias = [];
            } catch {
                referencias = [];
            }
        }

        referencias = referencias.filter(r => !(r.ref === ref && r.dominio === dominio));

        await pool.request()
            .input('id', mssql.Int, id)
            .input('refs', mssql.NVarChar(mssql.MAX), JSON.stringify(referencias))
            .query('UPDATE FINANCE_PROVEEDORES SET REFERENCIA = @refs WHERE Id = @id');

        res.json({ success: true, referencias });
    } catch (error) {
        console.error('[Referencias] Error DELETE:', error.message);
        res.status(500).json({ error: 'Error al eliminar referencia' });
    }
});

export default router;